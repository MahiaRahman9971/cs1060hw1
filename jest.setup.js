// Mock D3 and TopoJSON since they're loaded via script tags
global.d3 = {
  select: jest.fn(),
  json: jest.fn(),
  geoPath: jest.fn(),
  geoAlbersUsa: jest.fn(),
};

global.topojson = {
  feature: jest.fn(),
};
