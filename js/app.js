/**
 * Main application script for the network graph visualization
 */
let isCached = false;
let host = "10.222.3.84:2105";

let intervalId ; // Biến lưu id của interval hiện tại
// Initialize network visualization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize DOM elements
    const container = document.getElementById('mynetwork');
    
    // Initialize DataSets
    let nodes = new vis.DataSet([]);
    let edges = new vis.DataSet([]);
    
    // Create network object
    const data = {
        nodes: nodes,
        edges: edges
    };
    
    // Create network instance
    const network = new vis.Network(container, data, options);
    
    // Initialize nodeMap to track added nodes
    const nodeMap = new Map();
    
    // Objects mapping IDs to names
    const serverNames = {};
    const serviceNames = {};
    
    // Load data from API
    async function loadData(apiUrl) {
        
        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDUyMjI0MjIsImlhdCI6MTc0NTIxODgyMiwiaXNzIjoidndmcyIsIm5iZiI6MTc0NTIxODgyMiwicGVybWlzc2lvbnMiOlsiVmlldyIsIkFkZCIsIkVkaXQiLCJEZWxldGUiLCJFeGVjdXRlIiwiSW52b2tlIiwiQWRtaW4iLCJTdXBlckFkbWluIl0sInJvbGVzIjpbIlN1cGVyQWRtaW4iXSwic3ViIjoiYWRtaW4iLCJ0ZW5hbnRJZCI6IjY3ZTUxMTg2OTA4NWNlM2I5MDJiNTA2OCIsInVzZXJJZCI6ImFkbWluIn0.pA-bW-Glof4PGn8El5pmydyUymuRZ7RQzVNmphpNMhY" // Replace with actual token if required
                }
            });
            
            if (!response.ok) {
                console.error(response);
                throw new Error("Failed to fetch GEXF content from API");
            }
            const jsonResponse = await response.json();
            const gexfContent = jsonResponse.result?.data?.content;

            if (!gexfContent) {
                throw new Error("Invalid GEXF content in API response");
            }

            const parser = new DOMParser();
            const gexfXml = parser.parseFromString(gexfContent, "application/xml");

            updateStatus(`Đã load dữ liệu từ API thành công!`, "success");
            return gexfXml;
        } catch (error) {
            console.error('Error fetching GEXF from API:', error);
            updateStatus("Lỗi: " + error.message, "error");
            return null;
        }
    }

    // Update node colors
    function updateNodeColors() {
        nodes.forEach(node => {
            if (node.group === 'Services') {
                node.color = {
                    background: '#2ecc71', // Bright green for services
                    border: '#27ae60'
                };
            } else if (node.group === 'Servers') {
                node.color = {
                    background: '#3498db', // Bright blue for servers
                    border: '#2980b9'
                };
            }
            nodes.update(node);
        });
    }
    
    // Periodically fetch service statuses and update node colors
    async function fetchServiceStatuses() {
        if (!isCached) return; // Skip if data is cached
        try {
            let url = 'http://{host}/api/v2/workflow/model/start_name/multi_metric_change_bc/await';
            let des  = url.replace(/{host}/g, host);
            const response = await fetch(des, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDUyMjI0MjIsImlhdCI6MTc0NTIxODgyMiwiaXNzIjoidndmcyIsIm5iZiI6MTc0NTIxODgyMiwicGVybWlzc2lvbnMiOlsiVmlldyIsIkFkZCIsIkVkaXQiLCJEZWxldGUiLCJFeGVjdXRlIiwiSW52b2tlIiwiQWRtaW4iLCJTdXBlckFkbWluIl0sInJvbGVzIjpbIlN1cGVyQWRtaW4iXSwic3ViIjoiYWRtaW4iLCJ0ZW5hbnRJZCI6IjY3ZTUxMTg2OTA4NWNlM2I5MDJiNTA2OCIsInVzZXJJZCI6ImFkbWluIn0.pA-bW-Glof4PGn8El5pmydyUymuRZ7RQzVNmphpNMhY" // Replace with actual token if required
                }
            });

            if (!response.ok) {
                console.error("Failed to fetch service statuses:", response);
                return;
            }

            const jsonResponse = await response.json();
            const serviceStatuses = jsonResponse.result?.data;

            if (!serviceStatuses) {
                console.error("Invalid service statuses in API response");
                return;
            }

            // Update node colors based on service statuses
            serviceStatuses.forEach(status => {
                const { host, port, isGood, Disk , Ram } = status;

                // Find the matching node by comparing host and port
                const matchingNode = nodes.get({
                    filter: node => node.group === 'Services' &&
                                    node.attvalues &&
                                    node.attvalues.host === host &&
                                    node.attvalues.port === port.toString()
                })[0];

                if (matchingNode) {
                    let tmp = matchingNode.label.split('\n')[0]; // Keep the first line of the label
                    matchingNode.label = tmp + `\nFDisk : ${Disk}%\nFRam: ${Ram}%`; // Update label to show host and port
                    matchingNode.color = {
                        background: isGood ? '#2ecc71' : '#e74c3c', // Green if good, red if not
                        border: isGood ? '#27ae60' : '#c0392b'
                    };
                    nodes.update(matchingNode);
                }
            });
        } catch (error) {
            console.error("Error fetching service statuses:", error);
        }
    }

    // Process GEXF nodes and edges
    function processGexfData(gexfXml) {
        if (!gexfXml) return;

        const nodesXml = gexfXml.querySelectorAll("node");
        const edgesXml = gexfXml.querySelectorAll("edge");

        // Process nodes
        nodesXml.forEach(node => {
            const id = node.getAttribute("id");
            const label = node.getAttribute("label") || `Node ${id}`;
            const group = id.startsWith("Services/") ? "Services" : "Servers";

            // Extract attributes for services
            const attvalues = {};
            node.querySelectorAll("attvalue").forEach(attvalue => {
                const key = attvalue.getAttribute("for");
                const value = attvalue.getAttribute("value");
                attvalues[key] = value;
            });

            if (!nodeMap.has(id)) {
                const nodeData = {
                    id: id,
                    label: label,
                    color: {
                        color: '#9b59b6',
                        highlight: '#8e44ad',
                        hover: '#8e44ad'
                    },
                    group: group,
                    attvalues: attvalues, // Store attributes for later use
                    title: `Node: ${label} - ID: ${id} - Host:Port: ${attvalues.host}:${attvalues.port}`,
                    shape: 'dot',
                };
                nodeMap.set(id, nodeData);
                nodes.add(nodeData);
            }
        });

        // Process edges
        edgesXml.forEach(edge => {
            const id = edge.getAttribute("id");
            const source = edge.getAttribute("source");
            const target = edge.getAttribute("target");
            const label = edge.getAttribute("label") || `Edge ${id}`;

            // Determine edge color based on type
            let edgeColor = '#9b59b6'; // Default to light purple
            if (id.startsWith("connect/")) {
                edgeColor = '#2ecc71'; // Green for "connect"
            } else if (id.startsWith("manage/")) {
                edgeColor = '#9b59b6'; // Light purple for "manage"
            }

            if (!edges.get(id)) {
                const edgeData = {
                    id: id,
                    from: source,
                    to: target,
                    title: `Edge: ${label}<br>From: ${source} → To: ${target}`,
                    color: {
                        color: edgeColor,
                        highlight: edgeColor,
                        hover: edgeColor
                    },
                    width: 1.5,
                    arrows: {
                        to: {
                            enabled: true,
                            scaleFactor: 0.5
                        }
                    }
                };
                edges.add(edgeData);
            }
        });

        // Update initial node colors
        updateNodeColors();
    }

    // Load all data from API
    async function loadAllData() {
        // Clear old data
        nodes.clear();
        edges.clear();
        nodeMap.clear();

        updateStatus("Đang tải dữ liệu...", "info");

        try {
            let url = 'http://{host}/api/v2/workflow/model/start_id/67e4c62828ddf42f3c003dc5/await';
            des = url.replace(/{host}/g, host);

            const gexfXml = await loadData(des);
            processGexfData(gexfXml);
            isCached = true; // Set cached flag to true
            // Fit view and notify
            network.fit();
            updateStatus(`Đã load tất cả dữ liệu: ${nodes.length} nodes và ${edges.length} edges`, "success");

            // Apply the current layout
            document.getElementById('layoutSelect').dispatchEvent(new Event('change'));
        } catch (error) {
            console.error('Error loading all data:', error);
            updateStatus("Lỗi: " + error.message, "error");
        }
    }
    
    // Event handlers
    document.getElementById('loadAllBtn').addEventListener('click', loadAllData);
    
    document.getElementById('fitBtn').addEventListener('click', function() {
        network.fit();
        updateStatus("Đã điều chỉnh khung nhìn", "info");
    });
    
    document.getElementById('stabilizeBtn').addEventListener('click', function() {
        updateStatus("Đang tối ưu layout...", "info");
        network.stabilize(100);
    });
    
    document.getElementById('togglePhysicsBtn').addEventListener('click', function() {
        const physics = !network.physics.options.enabled;
        network.setOptions({ physics: { enabled: physics } });
        updateStatus(physics ? "Physics: Bật" : "Physics: Tắt", physics ? "success" : "info");
        setActiveButton(this, physics);
    });

    // Node selection handling
    let selectedNode = null;

    network.on("selectNode", function(params) {
        if (params.nodes.length > 0) {
            selectedNode = params.nodes[0];
            const node = nodes.get(selectedNode);
            if (node) {
                updateStatus(`Đã chọn node: ${node.label || node.id}`, "info");
            }
        } else {
            selectedNode = null;
        }
    });

    document.getElementById('zoomToNodeBtn').addEventListener('click', function() {
        if (selectedNode) {
            const node = nodes.get(selectedNode);
            if (!node) {
                updateStatus("Không thể tìm thấy node đã chọn", "warning");
                return;
            }

            // Get node position
            const position = network.getPositions([selectedNode])[selectedNode];
            
            // Zoom to node
            network.moveTo({
                position: position,
                scale: 1.5,
                animation: {
                    duration: 1000,
                    easingFunction: 'easeInOutQuad'
                }
            });
            
            updateStatus(`Đã phóng to đến node: ${node.label || node.id}`, "success");
        } else {
            updateStatus("Vui lòng chọn một node trước", "warning");
        }
    });

    // Handle layout switching
    document.getElementById('layoutSelect').addEventListener('change', function() {
        const layoutType = this.value;
        let newLayout = {};
        
        // Hide or show hierarchical options
        document.getElementById('hierarchicalOptions').style.display = 
            layoutType === 'hierarchical' ? 'block' : 'none';
        
        if (layoutType === 'hierarchical') {
            newLayout = {
                randomSeed: undefined,
                improvedLayout: true,
                hierarchical: layoutOptions.hierarchical
            };
            network.setOptions({ physics: { enabled: false } });
        } 
        else if (layoutType === 'force') {
            newLayout = {
                randomSeed: undefined,
                improvedLayout: true,
                hierarchical: { enabled: false }
            };
            network.setOptions({ 
                physics: { 
                    enabled: true,
                    barnesHut: {
                        gravitationalConstant: -2000,
                        centralGravity: 0.3,
                        springLength: 150,
                        springConstant: 0.04
                    }
                } 
            });
        }
        else if (layoutType === 'circular') {
            newLayout = {
                randomSeed: 2,
                improvedLayout: true,
                hierarchical: { enabled: false }
            };
            
            // Apply circular layout manually
            const nodePositions = {};
            const nodeCount = nodes.length;
            const radius = Math.min(container.offsetWidth, container.offsetHeight) * 0.4;
            const center = {
                x: container.offsetWidth / 2,
                y: container.offsetHeight / 2
            };
            
            let i = 0;
            nodes.forEach(node => {
                const angle = 2 * Math.PI * i / nodeCount;
                nodePositions[node.id] = {
                    x: center.x + radius * Math.cos(angle),
                    y: center.y + radius * Math.sin(angle)
                };
                i++;
            });
            
            network.setOptions({ physics: { enabled: false } });
            network.setData(data);
            network.moveTo({ position: center, scale: 0.8 });
            
            setTimeout(() => {
                nodes.forEach(node => {
                    network.moveNode(node.id, nodePositions[node.id].x, nodePositions[node.id].y);
                });
            }, 10);
        }
        
        // Apply layout changes
        network.setOptions({ layout: newLayout });
        network.stabilize(100);
    });
    
    // Handle hierarchical direction change
    document.getElementById('directionSelect').addEventListener('change', function() {
        const direction = this.value;
        layoutOptions.hierarchical.direction = direction;
        
        // Only apply if hierarchical layout is active
        if (document.getElementById('layoutSelect').value === 'hierarchical') {
            network.setOptions({ 
                layout: { 
                    hierarchical: layoutOptions.hierarchical 
                } 
            });
            network.stabilize(100);
        }
    });
    // change host
    document.getElementById('cbbConfig').addEventListener('change', function() {
        host = this.value;
    });
    // Apply node style presets
    document.getElementById('nodeStyleSelect').addEventListener('change', function() {
        const styleType = this.value;
        if (nodeStyles[styleType]) {
            network.setOptions(nodeStyles[styleType]);
        }
    });

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    // Handle search input with debounce
    const handleSearch = debounce(function(query) {
        // Hide results if query is too short
        if (query.length < 2) {
            searchResults.style.display = 'none';
            return;
        }
        
        query = query.toLowerCase();
        
        // Search in nodes efficiently
        const matchingNodes = nodes.get({
            filter: node => {
                return (node.label && node.label.toLowerCase().includes(query)) ||
                       (node.id && node.id.toLowerCase().includes(query));
            }
        });
        
        // Clear previous results
        searchResults.innerHTML = '';
        
        // Display results if any matches found
        if (matchingNodes.length > 0) {
            const fragment = document.createDocumentFragment();
            
            matchingNodes.forEach(node => {
                const div = document.createElement('div');
                div.className = 'search-result-item';
                div.innerHTML = `${node.label || node.id} <span class="result-type">${node.group || 'Node'}</span>`;
                div.addEventListener('click', () => {
                    selectAndZoomToNode(node);
                });
                fragment.appendChild(div);
            });
            
            searchResults.appendChild(fragment);
            searchResults.style.display = 'block';
        } else {
            searchResults.style.display = 'none';
        }
    }, 300); // 300ms debounce delay

    // Extract node selection and zooming to a reusable function
    function selectAndZoomToNode(node) {
        network.selectNodes([node.id]);
        selectedNode = node.id;
        
        // Zoom to node
        const position = network.getPositions([node.id])[node.id];
        network.moveTo({
            position: position,
            scale: 1.5,
            animation: {
                duration: 1000,
                easingFunction: 'easeInOutQuad'
            }
        });
        
        // Clear search
        searchInput.value = '';
        searchResults.style.display = 'none';
        
        updateStatus(`Đã chọn node: ${node.label || node.id}`);
    }

    // Connect the search handler
    searchInput.addEventListener('input', function() {
        handleSearch(this.value);
    });

    // Hide search results when clicking elsewhere
    document.addEventListener('click', function(event) {
        if (!searchResults.contains(event.target) && event.target !== searchInput) {
            searchResults.style.display = 'none';
        }
    });
    

    document.getElementById('SetTimeBtn').addEventListener('click', function() {
        // Xóa interval cũ nếu tồn tại
        if (intervalId) {
            clearInterval(intervalId);
            console.log("Previous interval cleared.");
        }

        // Lấy giá trị thời gian làm mới từ input
        let refreshTime = refreshTimeInput.value*1000 || 1000;
        console.log(`Refresh time set to ${refreshTime} s`);

        // Tạo interval mới và lưu id
        intervalId = setInterval(fetchServiceStatuses, refreshTime);
    });
    
    // Mini Map Implementation - using canvas scaling approach
    function initMiniMap() {
        // Create container for mini map if it doesn't exist yet
        if (!document.getElementById('miniMap')) {
            const graphContainer = document.querySelector('.graph-container');
            
            // Create mini map container
            const miniMapContainer = document.createElement('div');
            miniMapContainer.className = 'mini-map-container';
            miniMapContainer.id = 'miniMapContainer';
            
            // Create mini map title
            const miniMapTitle = document.createElement('div');
            miniMapTitle.className = 'mini-map-title';
            miniMapTitle.textContent = 'Overview';
            
            // Create mini map canvas
            const miniMapCanvas = document.createElement('canvas');
            miniMapCanvas.id = 'miniMap';
            miniMapCanvas.className = 'mini-map';
            
            // Create viewport indicator
            const viewport = document.createElement('div');
            viewport.id = 'miniMapViewport';
            viewport.className = 'mini-map-viewport';
            
            // Add elements to container
            miniMapContainer.appendChild(miniMapTitle);
            miniMapContainer.appendChild(miniMapCanvas);
            miniMapContainer.appendChild(viewport);
            graphContainer.appendChild(miniMapContainer);
            
            // Add click handler for navigation
            miniMapContainer.addEventListener('click', function(event) {
                if (event.target === miniMapCanvas) {
                    // Get relative position in mini map
                    const rect = miniMapCanvas.getBoundingClientRect();
                    const x = event.clientX - rect.left;
                    const y = event.clientY - rect.top;
                    
                    // Calculate the scale ratio between main network and mini map
                    const scaleRatio = network.canvas.frame.canvas.width / miniMapCanvas.width;
                    
                    // Convert click position to main network position
                    const mainNetworkX = x * scaleRatio;
                    const mainNetworkY = y * scaleRatio;
                    
                    // Convert to network coordinates
                    const pos = network.DOMtoCanvas({
                        x: mainNetworkX,
                        y: mainNetworkY
                    });
                    
                    // Move main network to this position
                    network.moveTo({
                        position: pos,
                        animation: {
                            duration: 500,
                            easingFunction: 'easeInOutQuad'
                        }
                    });
                    
                    // Show status message
                    updateStatus("Repositioned view from mini-map", "info");
                }
            });
        }
        
        // Start rendering the mini map
        updateMiniMap();
    }

    function updateMiniMap() {
        const mainCanvas = network.canvas.frame.canvas;
        const miniCanvas = document.getElementById('miniMap');
        const viewport = document.getElementById('miniMapViewport');
        
        if (!mainCanvas || !miniCanvas || !viewport) return;
        
        const ctx = miniCanvas.getContext('2d');
        
        // Set mini canvas dimensions
        const miniMapWidth = 180;  // Match CSS width
        const miniMapHeight = 140; // Match CSS height
        miniCanvas.width = miniMapWidth;
        miniCanvas.height = miniMapHeight;
        
        // Calculate scale ratio between main view and mini map
        const scaleX = miniMapWidth / mainCanvas.width;
        const scaleY = miniMapHeight / mainCanvas.height;
        const scale = Math.min(scaleX, scaleY);
        
        // Clear mini map canvas with darker background to match sidebar
        ctx.fillStyle = '#34495e'; // Slightly lighter than sidebar for contrast
        ctx.fillRect(0, 0, miniMapWidth, miniMapHeight);
        
        // Center the scaled-down version
        const offsetX = (miniMapWidth - (mainCanvas.width * scale)) / 2;
        const offsetY = (miniMapHeight - (mainCanvas.height * scale)) / 2;
        
        // Draw the main canvas onto mini map canvas
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);
        ctx.drawImage(mainCanvas, 0, 0);
        ctx.restore();
        
        // Calculate viewport rectangle position and size
        const viewPos = network.getViewPosition();
        const viewScale = network.getScale();
        
        const canvasCenter = {
            x: mainCanvas.width / 2,
            y: mainCanvas.height / 2
        };
        
        const viewportWidth = mainCanvas.width / viewScale;
        const viewportHeight = mainCanvas.height / viewScale;
        
        const viewportLeft = canvasCenter.x - (viewportWidth / 2);
        const viewportTop = canvasCenter.y - (viewportHeight / 2);
        
        // Calculate position in mini map coordinates
        viewport.style.left = (viewportLeft * scale + offsetX) + 'px';
        viewport.style.top = (viewportTop * scale + offsetY) + 'px';
        viewport.style.width = (viewportWidth * scale) + 'px';
        viewport.style.height = (viewportHeight * scale) + 'px';
    }

    // Initialize mini map after the network is first drawn
    network.once('afterDrawing', initMiniMap);

    // Update mini map on network events
    network.on('afterDrawing', updateMiniMap);

    // Update mini map when window is resized
    window.addEventListener('resize', updateMiniMap);
    
    // Update mini map when data changes
    nodes.on('*', function() {
        if (nodes.length > 0) {
            setTimeout(updateMiniMap, 100);
        }
    });

    // Update mini map on network events
    network.on('zoom', updateMiniMap);
    network.on('dragEnd', updateMiniMap);

    // Initialize after page load
    initCollapsibleSections();

    intervalId = setInterval(fetchServiceStatuses, 1000);
});
