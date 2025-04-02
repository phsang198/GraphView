/**
 * Configuration and options for the network visualization
 */

// Layout options - different layout types
const layoutOptions = {
    hierarchical: {
        enabled: true,
        levelSeparation: 150,
        nodeSpacing: 100,
        treeSpacing: 200,
        blockShifting: true,
        edgeMinimization: true,
        parentCentralization: true,
        direction: 'UD',        // UD, DU, LR, RL
        sortMethod: 'hubsize',  // hubsize, directed
        shakeTowards: 'leaves'  // roots, leaves
    },
    force: {
        enabled: false
    },
    circular: {
        enabled: false
    }
};

// Base network options
const options = {
    nodes: {
        shape: 'dot',
        size: 16,
        font: {
            size: 12,
            color: '#000000'
        },
        borderWidth: 2
    },
    edges: {
        width: 0.3, 
        smooth: {
            type: 'continuous'
        },
        arrows: {
            to: {
                enabled: true,
                scaleFactor: 0.1
            }
        }
    },
    groups: {
        Servers: {
            color: {
                background: '#ff9900',
                border: '#b36b00'
            },
            shape: 'dot'
        },
        Services: {
            color: {
                background: '#3498db',
                border: '#2980b9'
            },
            shape: 'diamond'
        }
    },
    physics: {
        enabled: true,
        barnesHut: {
            gravitationalConstant: -2000,
            centralGravity: 0.3,
            springLength: 95,
            springConstant: 0.04
        },
        stabilization: {
            iterations: 1000
        }
    },
    interaction: {
        hover: true,
        tooltipDelay: 200,
        multiselect: true,
        navigationButtons: false,
        keyboard: false
    },
    layout: {
        randomSeed: undefined,
        improvedLayout: true,
        clusterThreshold: 150,
        hierarchical: layoutOptions.hierarchical
    }
};

// Node style presets
const nodeStyles = {
    default: {
        nodes: {
            shape: 'dot',
            size: 16,
            font: {
                size: 12,
                color: '#000000'
            },
            borderWidth: 2
        }
    },
    larger: {
        nodes: {
            shape: 'dot',
            size: 24,
            font: {
                size: 14,
                color: '#000000',
                face: 'arial'
            },
            borderWidth: 3
        }
    },
    minimal: {
        nodes: {
            shape: 'dot',
            size: 10,
            font: {
                size: 10,
                color: '#777777'
            },
            borderWidth: 1
        },
        edges: {
            width: 0.5,
            color: {
                color: '#999999',
                highlight: '#333333',
                hover: '#666666'
            }
        }
    },
    detailed: {
        nodes: {
            shape: 'box',
            size: 16,
            font: {
                size: 13,
                color: '#000000',
                face: 'monospace',
                multi: true,
                bold: {
                    color: '#000000',
                    size: 14,
                    face: 'arial',
                    mod: 'bold'
                }
            },
            borderWidth: 2,
            shadow: true
        }
    }
};

// Database connection settings
const cursor_url = "http://10.222.3.84:8529/_db/ServiceMesh/_api/cursor"; 
const Username = "root"; 
const Password = ""; 
