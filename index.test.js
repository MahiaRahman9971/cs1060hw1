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

        test('updateStateInfo displays state name', async () => {
            const mockState = {
                properties: {
                    name: 'Test State'
                }
            };

            global.fetch.mockImplementationOnce(() => 
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([["header"], ["100"]])
                })
            );

            await updateStateInfo(mockState);
            const stateInfo = document.getElementById('state-info');
            expect(stateInfo.innerHTML).toContain('Test State');
        });

        test('updateStateInfo shows loading state', async () => {
            const mockState = {
                properties: {
                    name: 'Test State'
                }
            };

            // Mock a delayed API response
            global.fetch.mockImplementationOnce(() => 
                new Promise(resolve => setTimeout(() => resolve({ 
                    ok: true,
                    json: () => Promise.resolve([["header"], ["100"]])
                }), 100))
            );

            const promise = updateStateInfo(mockState);
            const stateInfo = document.getElementById('state-info');
            expect(stateInfo.innerHTML).toContain('Loading');
            await promise;
        });
    });

    describe('Error Handling', () => {
        test('updateStateInfo handles missing state data gracefully', async () => {
            const mockState = {
                properties: {
                    name: 'Test State'
                }
            };

            // Mock a failed API response
            global.fetch.mockRejectedValueOnce(new Error('API Error'));

            await updateStateInfo(mockState);
            const stateInfo = document.getElementById('state-info');
            expect(stateInfo.innerHTML).toContain('Error loading state data');
        });

        test('updateStateInfo handles missing state properties', async () => {
            const mockState = {};
            await updateStateInfo(mockState);
            const stateInfo = document.getElementById('state-info');
            expect(stateInfo.innerHTML).toContain('Error loading state data');
        });
    });

    describe('API Integration', () => {
        test('fetchStateCensusData makes correct API call', async () => {
            const mockState = {
                properties: {
                    name: 'Virginia'
                }
            };

            global.fetch.mockImplementationOnce(() => 
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([["header"], ["100"]])
                })
            );

            await fetchStateCensusData(mockState);
            expect(fetch).toHaveBeenCalledWith(expect.stringContaining('api.census.gov'));
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
        });

        test('fetchStateCensusData caches responses', async () => {
            const mockState = {
                properties: {
                    name: 'Virginia'
                }
            };

            global.fetch.mockImplementationOnce(() => 
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([["header"], ["100"]])
                })
            );

            // First call
            await fetchStateCensusData(mockState);
            
            // Second call should use cache
            await fetchStateCensusData(mockState);

            expect(fetch).toHaveBeenCalledTimes(1);
        });
    });

    describe('Data Processing', () => {
        test('processes population data correctly', async () => {
            const mockState = {
                properties: {
                    name: 'Virginia'
                }
            };

            global.fetch.mockImplementationOnce(() => 
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([["header"], ["100"]])
                })
            );

            const data = await fetchStateCensusData(mockState);
            expect(data.population).toBe('100');
        });

        test('handles malformed API response', async () => {
            const mockState = {
                properties: {
                    name: 'Virginia'
                }
            };

            global.fetch.mockImplementationOnce(() => 
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(null)
                })
            );

            const data = await fetchStateCensusData(mockState);
            expect(data.population).toBe('Error loading data');
        });
    });
});
