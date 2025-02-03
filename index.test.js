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
            await updateStateInfo(null);
            const stateInfo = document.getElementById('state-info');
            expect(stateInfo.innerHTML).toContain('Hover over a state');
        });

        test('updateStateInfo displays state name and all data fields', async () => {
            const mockState = {
                properties: {
                    name: 'Test State'
                }
            };

            // Mock all API responses
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

            await updateStateInfo(mockState);
            const stateInfo = document.getElementById('state-info');
            expect(stateInfo.innerHTML).toContain('Test State');
            expect(stateInfo.innerHTML).toContain('$50,000');
            expect(stateInfo.innerHTML).toContain('18.0%'); // Education rate
            expect(stateInfo.innerHTML).toContain('35.5 years');
            expect(stateInfo.innerHTML).toContain('70.0%'); // Homeownership rate
        });

        test('updateStateInfo shows loading state', async () => {
            const mockState = {
                properties: {
                    name: 'Test State'
                }
            };

            // Mock delayed API responses
            const mockDelayedResponse = () => 
                new Promise(resolve => setTimeout(() => resolve({ 
                    ok: true,
                    json: () => Promise.resolve([["header"], ["100"]])
                }), 100));

            global.fetch
                .mockImplementationOnce(mockDelayedResponse)  // Population
                .mockImplementationOnce(mockDelayedResponse)  // Income
                .mockImplementationOnce(mockDelayedResponse)  // Education
                .mockImplementationOnce(mockDelayedResponse)  // Age
                .mockImplementationOnce(mockDelayedResponse); // Housing

            const promise = updateStateInfo(mockState);
            const stateInfo = document.getElementById('state-info');
            expect(stateInfo.innerHTML).toContain('Loading');
            await promise;
        });
    });

    describe('Error Handling', () => {
        test('handles API errors gracefully', async () => {
            const mockState = {
                properties: {
                    name: 'Test State'
                }
            };

            // Mock failed API responses
            global.fetch.mockRejectedValue(new Error('API Error'));

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

            global.fetch.mockImplementation(() => 
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(null)
                })
            );

            const data = await fetchStateCensusData(mockState);
            expect(data.population).toBe('Error loading data');
            expect(data.education).toBe('Error loading data');
            expect(data.homeownership).toBe('Error loading data');
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
