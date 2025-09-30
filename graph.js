class PromptGraph {
    constructor(container) {
        this.container = container;
        this.nodes = new Map();
        this.edges = [];
        this.nextNodeId = 0;
        this.nodePositions = new Map();
        this.isDragging = false;
        this.dragNode = null;
        this.setupContainer();
    }

    setupContainer() {
        this.container.style.position = 'relative';
        this.container.innerHTML = '';
        
        // Remove placeholder if exists
        const placeholder = this.container.querySelector('.graph-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
    }

    createNode(type, data, x = 0, y = 0) {
        const nodeId = `node-${this.nextNodeId++}`;
        const node = document.createElement('div');
        node.className = `node node-${type}`;
        node.id = nodeId;
        
        // Create node content based on type
        let content = '';
        switch (type) {
            case 'prompt':
                content = `
                    <div class="node-title">Prompt</div>
                    <div class="node-content">${this.truncateText(data.text, 100)}</div>
                `;
                break;
            case 'costar':
                content = `
                    <div class="node-title">${data.field}</div>
                    <div class="node-content">${this.truncateText(data.value, 80)}</div>
                `;
                break;
            case 'verdict':
                node.classList.add(data.verdict.toLowerCase().replace('_', '-'));
                content = `
                    <div class="node-title">Verdict</div>
                    <div class="node-content">${data.verdict}</div>
                `;
                break;
            case 'llm':
                content = `
                    <div class="node-title">${data.llm} Response</div>
                    <div class="node-content typing-effect" id="typing-${nodeId}"></div>
                `;
                break;
        }
        
        node.innerHTML = content;
        
        // Position node
        node.style.left = x + 'px';
        node.style.top = y + 'px';
        
        // Add event listeners
        this.addNodeEventListeners(node, data);
        
        // Add to container with animation
        this.container.appendChild(node);
        node.style.animation = 'nodeAppear 0.5s ease-out';
        
        // Store node data
        this.nodes.set(nodeId, {
            element: node,
            type,
            data,
            x,
            y,
            connections: []
        });
        
        this.nodePositions.set(nodeId, { x, y });
        
        return nodeId;
    }

    addNodeEventListeners(node, data) {
        // Hover effects
        node.addEventListener('mouseenter', (e) => {
            this.highlightConnections(node.id);
            this.showTooltip(e, data);
        });
        
        node.addEventListener('mouseleave', () => {
            this.clearHighlights();
            this.hideTooltip();
        });

        // Drag functionality
        node.addEventListener('mousedown', (e) => {
            this.startDrag(node, e);
        });
    }

    startDrag(node, e) {
        this.isDragging = true;
        this.dragNode = node;
        
        const rect = node.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        document.addEventListener('mousemove', this.handleDrag);
        document.addEventListener('mouseup', this.stopDrag);
        
        node.style.cursor = 'grabbing';
        node.style.zIndex = '1000';
    }

    handleDrag = (e) => {
        if (!this.isDragging || !this.dragNode) return;
        
        const containerRect = this.container.getBoundingClientRect();
        const newX = e.clientX - containerRect.left - this.dragOffset.x;
        const newY = e.clientY - containerRect.top - this.dragOffset.y;
        
        // Constrain to container bounds
        const maxX = this.container.clientWidth - this.dragNode.offsetWidth;
        const maxY = this.container.clientHeight - this.dragNode.offsetHeight;
        
        const constrainedX = Math.max(0, Math.min(newX, maxX));
        const constrainedY = Math.max(0, Math.min(newY, maxY));
        
        this.dragNode.style.left = constrainedX + 'px';
        this.dragNode.style.top = constrainedY + 'px';
        
        // Update stored position
        const nodeData = this.nodes.get(this.dragNode.id);
        if (nodeData) {
            nodeData.x = constrainedX;
            nodeData.y = constrainedY;
            this.nodePositions.set(this.dragNode.id, { x: constrainedX, y: constrainedY });
        }
        
        // Update connected edges
        this.updateEdges();
    }

    stopDrag = () => {
        if (this.dragNode) {
            this.dragNode.style.cursor = 'pointer';
            this.dragNode.style.zIndex = 'auto';
        }
        
        this.isDragging = false;
        this.dragNode = null;
        
        document.removeEventListener('mousemove', this.handleDrag);
        document.removeEventListener('mouseup', this.stopDrag);
    }

    createEdge(fromNodeId, toNodeId) {
        const fromNode = this.nodes.get(fromNodeId);
        const toNode = this.nodes.get(toNodeId);
        
        if (!fromNode || !toNode) return;
        
        const edge = document.createElement('div');
        edge.className = 'edge';
        edge.id = `edge-${fromNodeId}-${toNodeId}`;
        
        this.container.appendChild(edge);
        
        const edgeData = {
            element: edge,
            from: fromNodeId,
            to: toNodeId
        };
        
        this.edges.push(edgeData);
        
        // Add to node connections
        fromNode.connections.push(toNodeId);
        toNode.connections.push(fromNodeId);
        
        // Position and animate edge
        this.positionEdge(edgeData);
        edge.style.animation = 'edgeGrow 0.8s ease-out';
        
        return edge;
    }

    positionEdge(edgeData) {
        const fromNode = this.nodes.get(edgeData.from);
        const toNode = this.nodes.get(edgeData.to);
        
        if (!fromNode || !toNode) return;
        
        const fromRect = fromNode.element.getBoundingClientRect();
        const toRect = toNode.element.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        const fromCenterX = fromNode.x + fromNode.element.offsetWidth / 2;
        const fromCenterY = fromNode.y + fromNode.element.offsetHeight / 2;
        const toCenterX = toNode.x + toNode.element.offsetWidth / 2;
        const toCenterY = toNode.y + toNode.element.offsetHeight / 2;
        
        const deltaX = toCenterX - fromCenterX;
        const deltaY = toCenterY - fromCenterY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX);
        
        edgeData.element.style.left = fromCenterX + 'px';
        edgeData.element.style.top = fromCenterY + 'px';
        edgeData.element.style.width = distance + 'px';
        edgeData.element.style.transform = `rotate(${angle}rad)`;
    }

    updateEdges() {
        this.edges.forEach(edge => this.positionEdge(edge));
    }

    highlightConnections(nodeId) {
        const nodeData = this.nodes.get(nodeId);
        if (!nodeData) return;
        
        // Highlight connected nodes
        nodeData.connections.forEach(connectedId => {
            const connectedNode = this.nodes.get(connectedId);
            if (connectedNode) {
                connectedNode.element.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.6)';
            }
        });
        
        // Highlight connected edges
        this.edges.forEach(edge => {
            if (edge.from === nodeId || edge.to === nodeId) {
                edge.element.classList.add('highlighted');
            }
        });
    }

    clearHighlights() {
        this.nodes.forEach(nodeData => {
            nodeData.element.style.boxShadow = '';
        });
        
        this.edges.forEach(edge => {
            edge.element.classList.remove('highlighted');
        });
    }

    showTooltip(e, data) {
        const tooltip = document.getElementById('tooltip');
        let content = '';
        
        switch (data.type || 'unknown') {
            case 'prompt':
                content = `<strong>Prompt Analysis</strong><br>${data.text}`;
                break;
            case 'costar':
                content = `<strong>COSTAR: ${data.field}</strong><br>${data.value}`;
                break;
            case 'verdict':
                content = `<strong>Verdict: ${data.verdict}</strong><br>Reasons: ${data.reasons?.join(', ') || 'N/A'}`;
                break;
            case 'llm':
                content = `<strong>${data.llm} Response</strong><br>Click to view full response`;
                break;
            default:
                content = 'Node details';
        }
        
        tooltip.innerHTML = content;
        tooltip.style.left = e.pageX + 10 + 'px';
        tooltip.style.top = e.pageY + 10 + 'px';
        tooltip.classList.add('visible');
    }

    hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        tooltip.classList.remove('visible');
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    calculateOptimalPositions(centerX, centerY, nodeCount, radius = 150) {
        const positions = [];
        const angleStep = (2 * Math.PI) / Math.max(nodeCount, 1);
        
        for (let i = 0; i < nodeCount; i++) {
            const angle = i * angleStep - Math.PI / 2; // Start from top
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            positions.push({ x, y });
        }
        
        return positions;
    }

    addPromptAnalysis(promptData) {
        const containerWidth = this.container.clientWidth;
        const containerHeight = this.container.clientHeight;
        
        // Main prompt node at center-left
        const promptX = containerWidth * 0.2;
        const promptY = containerHeight * 0.3;
        
        const promptNodeId = this.createNode('prompt', {
            type: 'prompt',
            text: promptData.original_prompt || promptData.prompt
        }, promptX, promptY);
        
        // COSTAR nodes in a circle around prompt
        const costarFields = Object.entries(promptData.costar || {});
        const costarPositions = this.calculateOptimalPositions(
            promptX + 250, promptY, costarFields.length, 100
        );
        
        const costarNodeIds = [];
        costarFields.forEach(([field, value], index) => {
            const pos = costarPositions[index] || { x: promptX + 300, y: promptY + index * 80 };
            const nodeId = this.createNode('costar', {
                type: 'costar',
                field,
                value
            }, pos.x, pos.y);
            
            costarNodeIds.push(nodeId);
            
            // Create edge with delay for animation
            setTimeout(() => {
                this.createEdge(promptNodeId, nodeId);
            }, 200 + index * 100);
        });
        
        // Verdict node
        const verdictX = promptX + 500;
        const verdictY = promptY - 50;
        
        const verdictNodeId = this.createNode('verdict', {
            type: 'verdict',
            verdict: promptData.verdict,
            reasons: promptData.reasons
        }, verdictX, verdictY);
        
        setTimeout(() => {
            this.createEdge(promptNodeId, verdictNodeId);
        }, 1000);
        
        return {
            promptNodeId,
            costarNodeIds,
            verdictNodeId
        };
    }

    addLLMResponse(llmData, verdictNodeId) {
        const verdictNode = this.nodes.get(verdictNodeId);
        if (!verdictNode) return;
        
        const llmX = verdictNode.x + 200;
        const llmY = verdictNode.y + 100;
        
        const llmNodeId = this.createNode('llm', {
            type: 'llm',
            llm: llmData.llm,
            response: llmData.response
        }, llmX, llmY);
        
        // Create edge
        setTimeout(() => {
            this.createEdge(verdictNodeId, llmNodeId);
            
            // Start typing animation
            this.animateTyping(llmNodeId, llmData.response);
        }, 300);
        
        return llmNodeId;
    }

    animateTyping(nodeId, text) {
        const typingElement = document.getElementById(`typing-${nodeId}`);
        if (!typingElement) return;
        
        let index = 0;
        const speed = 50; // milliseconds per character
        
        function typeWriter() {
            if (index < text.length) {
                typingElement.textContent += text.charAt(index);
                index++;
                setTimeout(typeWriter, speed);
            } else {
                typingElement.classList.remove('typing-effect');
                typingElement.style.borderRight = 'none';
            }
        }
        
        typeWriter();
    }

    clear() {
        this.nodes.clear();
        this.edges = [];
        this.nodePositions.clear();
        this.nextNodeId = 0;
        this.container.innerHTML = `
            <div class="graph-placeholder">
                <div class="placeholder-icon">🔍</div>
                <p>Submit a prompt to see the analysis graph</p>
            </div>
        `;
    }

    clearSinglePrompt(promptNodeId) {
        const promptNode = this.nodes.get(promptNodeId);
        if (!promptNode) return;
        
        // Find all connected nodes
        const nodesToRemove = new Set([promptNodeId]);
        const edgesToRemove = [];
        
        // BFS to find all connected nodes
        const queue = [promptNodeId];
        const visited = new Set([promptNodeId]);
        
        while (queue.length > 0) {
            const currentId = queue.shift();
            const currentNode = this.nodes.get(currentId);
            
            if (currentNode) {
                currentNode.connections.forEach(connectedId => {
                    if (!visited.has(connectedId)) {
                        visited.add(connectedId);
                        queue.push(connectedId);
                        nodesToRemove.add(connectedId);
                    }
                });
            }
        }
        
        // Remove edges connected to these nodes
        this.edges = this.edges.filter(edge => {
            if (nodesToRemove.has(edge.from) || nodesToRemove.has(edge.to)) {
                edge.element.remove();
                edgesToRemove.push(edge);
                return false;
            }
            return true;
        });
        
        // Remove nodes with animation
        nodesToRemove.forEach(nodeId => {
            const nodeData = this.nodes.get(nodeId);
            if (nodeData) {
                nodeData.element.style.animation = 'nodeDisappear 0.3s ease-out forwards';
                setTimeout(() => {
                    nodeData.element.remove();
                    this.nodes.delete(nodeId);
                    this.nodePositions.delete(nodeId);
                }, 300);
            }
        });
        
        // If no nodes left, show placeholder
        setTimeout(() => {
            if (this.nodes.size === 0) {
                this.container.innerHTML = `
                    <div class="graph-placeholder">
                        <div class="placeholder-icon">🔍</div>
                        <p>Submit a prompt to see the analysis graph</p>
                    </div>
                `;
            }
        }, 400);
    }

    getPromptNodes() {
        const promptNodes = [];
        this.nodes.forEach((nodeData, nodeId) => {
            if (nodeData.type === 'prompt') {
                promptNodes.push({
                    id: nodeId,
                    data: nodeData.data,
                    element: nodeData.element
                });
            }
        });
        return promptNodes;
    }

    exportData() {
        const data = {
            nodes: Array.from(this.nodes.entries()).map(([id, nodeData]) => ({
                id,
                type: nodeData.type,
                data: nodeData.data,
                position: { x: nodeData.x, y: nodeData.y }
            })),
            edges: this.edges.map(edge => ({
                from: edge.from,
                to: edge.to
            })),
            timestamp: new Date().toISOString()
        };
        
        return data;
    }
}

// Export for use in other files
window.PromptGraph = PromptGraph;