const { fetchStateCensusData, updateStateInfo, censusData } = require('./index.js');

describe('Census State Profiles', () => {
    beforeEach(() => {
        // Set up our document body
        document.body.innerHTML = `
            <div id="map"></div>
            <div id="state-info">
                <p class="placeholder">Hover over a state to see its information</p>
            </div>
        `;
        
        // Mock fetch for API calls
        global.fetch = jest.fn();
        
        // Reset the cache
        Object.keys(censusData).forEach(key => delete censusData[key]);
    });

    describe('UI Interactions', () => {
        test('updateStateInfo handles null state', async () => {
            document.body.innerHTML = `
                <div id="state-info"></div>
            `;

            await updateStateInfo(null);
            expect(document.getElementById('state-info').innerHTML)
                .toContain('Hover over a state to see its information');
        });

        test('updateStateInfo displays state name and all data fields', async () => {
            document.body.innerHTML = `
                <div id="state-info"></div>
            `;

            const mockState = {
                properties: {
                    name: 'Test State'
                }
            };

            const mockData = {
                population: '100,000',
                medianIncome: '$50,000',
                education: '35.5%',
                medianAge: '38.2 years',
                homeownership: '65.8%'
            };

            global.fetch.mockImplementation(() => 
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([["header"], ["100"]])
                })
            );

            await updateStateInfo(mockState);
            const stateInfo = document.getElementById('state-info');
            
            expect(stateInfo.innerHTML).toContain('Test State');
            expect(stateInfo.innerHTML).toContain('Population');
            expect(stateInfo.innerHTML).toContain('Median Household Income');
            expect(stateInfo.innerHTML).toContain('Education');
            expect(stateInfo.innerHTML).toContain('Median Age');
            expect(stateInfo.innerHTML).toContain('Homeownership Rate');
        });

        test('updateStateInfo shows loading state', async () => {
            document.body.innerHTML = `
                <div id="state-info"></div>
            `;

            const mockState = {
                properties: {
                    name: 'Test State'
                }
            };

            // Create a promise that never resolves to simulate loading
            global.fetch.mockImplementation(() => new Promise(() => {}));

            updateStateInfo(mockState);
            
            const stateInfo = document.getElementById('state-info');
            expect(stateInfo.innerHTML).toContain('Loading state data');
        });
    });

    describe('Error Handling', () => {
        test('handles API errors gracefully', async () => {
            const mockState = {
                properties: {
                    name: 'Test State'
                }
            };

            global.fetch.mockRejectedValueOnce(new Error('API Error'));

            const data = await fetchStateCensusData(mockState);
            expect(data.population).toBe('Error loading data');
            expect(data.medianIncome).toBe('Error loading data');
            expect(data.education).toBe('Error loading data');
            expect(data.medianAge).toBe('Error loading data');
            expect(data.homeownership).toBe('Error loading data');
        });

        test('handles malformed responses', async () => {
            const mockState = {
                properties: {
                    name: 'Test State'
                }
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve([])
            });

            const data = await fetchStateCensusData(mockState);
            expect(data.population).toBe('Error loading data');
        });
    });

    describe('Data Processing', () => {
        test('processes all census data correctly', async () => {
            const mockState = {
                properties: {
                    name: 'Virginia'
                }
            };

            global.fetch
                // Population data
                .mockImplementationOnce(() => 
                    Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve([["header"], ["8500000"]])
                    })
                )
                // Income data
                .mockImplementationOnce(() => 
                    Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve([["header"], ["75000"]])
                    })
                )
                // Education data
                .mockImplementationOnce(() => 
                    Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve([["header"], ["2000000", "1000000", "500000", "250000", "5000000"]])
                    })
                )
                // Age data
                .mockImplementationOnce(() => 
                    Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve([["header"], ["38.2"]])
                    })
                )
                // Housing data
                .mockImplementationOnce(() => 
                    Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve([["header"], ["1500000", "2000000"]])
                    })
                );

            const data = await fetchStateCensusData(mockState);
            expect(data.population).toBe('8,500,000');
            expect(data.medianIncome).toBe('$75,000');
            expect(data.education).toBe('75.0%');  // (2M + 1M + 500K + 250K) / 5M * 100
            expect(data.medianAge).toBe('38.2 years');
            expect(data.homeownership).toBe('75.0%');  // 1.5M / 2M * 100
        });

        test('caches responses correctly', async () => {
            const mockState = {
                properties: {
                    name: 'Virginia'
                }
            };

            // Set up mock responses for all endpoints
            const mockSuccessResponse = () => 
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([["header"], ["100"]])
                });

            global.fetch
                .mockImplementationOnce(mockSuccessResponse)  // Population
                .mockImplementationOnce(mockSuccessResponse)  // Income
                .mockImplementationOnce(() =>                 // Education
                    Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve([["header"], ["100", "100", "100", "100", "1000"]])
                    })
                )
                .mockImplementationOnce(mockSuccessResponse)  // Age
                .mockImplementationOnce(() =>                 // Housing
                    Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve([["header"], ["750", "1000"]])
                    })
                );

            // First call
            await fetchStateCensusData(mockState);
            
            // Second call should use cache
            await fetchStateCensusData(mockState);

            // Should only make API calls once
            expect(fetch).toHaveBeenCalledTimes(5);  // One for each endpoint
        });
    });

    describe('API Integration', () => {
        test('fetchStateCensusData makes correct API calls', async () => {
            const mockState = {
                properties: {
                    name: 'Virginia'
                }
            };

            global.fetch
                // Population data
                .mockImplementationOnce(() => 
                    Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve([["header"], ["100"]])
                    })
                )
                // Income data
                .mockImplementationOnce(() => 
                    Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve([["header"], ["50000"]])
                    })
                )
                // Education data
                .mockImplementationOnce(() => 
                    Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve([["header"], ["1000", "500", "200", "100", "10000"]])
                    })
                )
                // Age data
                .mockImplementationOnce(() => 
                    Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve([["header"], ["35.5"]])
                    })
                )
                // Housing data
                .mockImplementationOnce(() => 
                    Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve([["header"], ["7000", "10000"]])
                    })
                );

            await fetchStateCensusData(mockState);
            expect(fetch).toHaveBeenCalledWith(expect.stringContaining('api.census.gov'));
            expect(fetch).toHaveBeenCalledWith(expect.stringContaining('acs/acs5'));
            expect(fetch).toHaveBeenCalledTimes(5); // One call for each endpoint
        });

        test('fetchStateCensusData handles network error', async () => {
            const mockState = {
                properties: {
                    name: 'Virginia'
                }
            };

            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            const data = await fetchStateCensusData(mockState);
            expect(data.population).toBe('Error loading data');
            expect(data.medianIncome).toBe('Error loading data');
            expect(data.education).toBe('Error loading data');
            expect(data.medianAge).toBe('Error loading data');
            expect(data.homeownership).toBe('Error loading data');
        });

        test('fetchStateCensusData caches responses', async () => {
            const mockState = {
                properties: {
                    name: 'Virginia'
                }
            };

            // Set up mock responses for all endpoints
            const mockSuccessResponse = () => 
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([["header"], ["100"]])
                });

            global.fetch
                .mockImplementationOnce(mockSuccessResponse)  // Population
                .mockImplementationOnce(mockSuccessResponse)  // Income
                .mockImplementationOnce(() =>                 // Education
                    Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve([["header"], ["100", "100", "100", "100", "1000"]])
                    })
                )
                .mockImplementationOnce(mockSuccessResponse)  // Age
                .mockImplementationOnce(() =>                 // Housing
                    Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve([["header"], ["750", "1000"]])
                    })
                );

            // First call
            await fetchStateCensusData(mockState);
            
            // Second call should use cache
            await fetchStateCensusData(mockState);

            // Should only make API calls once
            expect(fetch).toHaveBeenCalledTimes(5);  // One for each endpoint
        });
    });
});
