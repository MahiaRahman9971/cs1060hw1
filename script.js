document.addEventListener('DOMContentLoaded', function() {
    const mapContainer = document.getElementById('map-container');
    
    // Load the SVG map from Wikipedia
    fetch('https://upload.wikimedia.org/wikipedia/commons/1/1a/Blank_US_Map_%28states_only%29.svg')
        .then(response => response.text())
        .then(svgContent => {
            mapContainer.innerHTML = svgContent;
            
            // Add click event listeners to all state paths
            const paths = document.querySelectorAll('path');
            paths.forEach(path => {
                path.addEventListener('click', function(e) {
                    // Remove highlight from all states
                    paths.forEach(p => p.classList.remove('highlighted'));
                    
                    // Add highlight to clicked state
                    this.classList.add('highlighted');
                });
            });
        })
        .catch(error => {
            console.error('Error loading the SVG map:', error);
            mapContainer.innerHTML = 'Error loading the map';
        });
});
