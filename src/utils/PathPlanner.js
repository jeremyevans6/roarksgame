export default class PathPlanner {
    constructor(options) {
        this.heights = options.heights;
        this.groundY = options.groundY;
        this.maxJumpHeight = options.maxJumpHeight;
        this.maxJumpDistance = options.maxJumpDistance;
        this.maxDrop = options.maxDrop;
        this.xStep = options.xStep;
    }

    buildPath(segmentStart, segmentLength) {
        const nodes = this.buildNodes(segmentStart, segmentLength);
        const start = this.closestNode(nodes, segmentStart + 40, this.groundY);
        const goal = this.closestNode(nodes, segmentStart + segmentLength - 40, this.groundY);
        if (!start || !goal) return [];
        const path = this.aStar(nodes, start, goal);
        return path.length ? path : [start, goal];
    }

    buildNodes(segmentStart, segmentLength) {
        const nodes = [];
        const xStart = segmentStart + 40;
        const xEnd = segmentStart + segmentLength - 40;
        for (let x = xStart; x <= xEnd; x += this.xStep) {
            nodes.push({ x, y: this.groundY });
            this.heights.forEach((y) => nodes.push({ x, y }));
        }
        return nodes;
    }

    closestNode(nodes, x, y) {
        let best = null;
        let bestDist = Infinity;
        nodes.forEach((node) => {
            const dx = node.x - x;
            const dy = node.y - y;
            const dist = dx * dx + dy * dy;
            if (dist < bestDist) {
                bestDist = dist;
                best = node;
            }
        });
        return best;
    }

    neighbors(nodes, node) {
        return nodes.filter((candidate) => {
            if (candidate === node) return false;
            const dx = Math.abs(candidate.x - node.x);
            const dy = candidate.y - node.y;
            if (dx > this.maxJumpDistance) return false;
            if (dy > this.maxJumpHeight) return false;
            if (dy < -this.maxDrop) return false;
            return true;
        });
    }

    aStar(nodes, start, goal) {
        const open = new Set([start]);
        const cameFrom = new Map();
        const gScore = new Map([[start, 0]]);
        const fScore = new Map([[start, this.heuristic(start, goal)]]);

        while (open.size) {
            let current = null;
            let bestScore = Infinity;
            open.forEach((node) => {
                const score = fScore.get(node) ?? Infinity;
                if (score < bestScore) {
                    bestScore = score;
                    current = node;
                }
            });

            if (current === goal) {
                return this.reconstructPath(cameFrom, current);
            }

            open.delete(current);
            this.neighbors(nodes, current).forEach((neighbor) => {
                const tentative = (gScore.get(current) ?? Infinity) + this.cost(current, neighbor);
                if (tentative < (gScore.get(neighbor) ?? Infinity)) {
                    cameFrom.set(neighbor, current);
                    gScore.set(neighbor, tentative);
                    fScore.set(neighbor, tentative + this.heuristic(neighbor, goal));
                    open.add(neighbor);
                }
            });
        }
        return [];
    }

    cost(a, b) {
        const dx = Math.abs(a.x - b.x);
        const dy = b.y - a.y;
        return dx + (dy > 0 ? dy * 1.5 : 0);
    }

    heuristic(a, b) {
        return Math.abs(a.x - b.x);
    }

    reconstructPath(cameFrom, current) {
        const path = [current];
        let cursor = current;
        while (cameFrom.has(cursor)) {
            cursor = cameFrom.get(cursor);
            path.unshift(cursor);
        }
        return path;
    }
}
