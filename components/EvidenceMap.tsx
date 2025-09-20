import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Document } from '../types';
import { LoadingSpinner } from '../constants';

interface Node {
  id: string;
  title: string;
  radius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Link {
  source: string;
  target: string;
  strength: number;
}

interface EvidenceMapProps {
  documents: Document[];
  onNodeClick: (title: string) => void;
}

const colors = ['#42A5F5', '#66BB6A', '#9575CD', '#FF7043', '#FFEE58'];

const getDocumentTags = (doc: Document): string[] => {
    return [
        ...(doc.subjects || []),
        ...(doc.riskFactors || []),
        ...(doc.keyPopulations || []),
        ...(doc.interventions || []),
    ];
};

export const EvidenceMap: React.FC<EvidenceMapProps> = ({ documents, onNodeClick }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const { width, height } = useMemo(() => {
    return { width: containerRef.current?.clientWidth || 800, height: 500 };
  }, [containerRef.current]);

  useEffect(() => {
    setIsLoading(true);

    const initialNodes: Node[] = documents.map((doc, i) => ({
      id: doc.id,
      title: doc.title,
      radius: 4 + (getDocumentTags(doc).length / 2),
      x: width / 2 + (Math.random() - 0.5) * 100,
      y: height / 2 + (Math.random() - 0.5) * 100,
      vx: 0,
      vy: 0,
    }));

    const docMap = new Map(documents.map(d => [d.id, getDocumentTags(d)]));
    const newLinks: Link[] = [];

    for (let i = 0; i < documents.length; i++) {
      for (let j = i + 1; j < documents.length; j++) {
        const docA = documents[i];
        const docB = documents[j];
        const tagsA = docMap.get(docA.id) || [];
        const tagsB = docMap.get(docB.id) || [];
        
        const sharedTags = tagsA.filter(tag => tagsB.includes(tag));
        if (sharedTags.length > 0) {
          newLinks.push({ source: docA.id, target: docB.id, strength: sharedTags.length });
        }
      }
    }
    
    setLinks(newLinks);

    // Simple force-directed layout simulation
    let simulationFrame: number;
    const iterations = 150;
    let currentIteration = 0;

    const simulate = () => {
        if (currentIteration >= iterations) {
            setIsLoading(false);
            return;
        }

        setNodes(currentNodes => {
            const updatedNodes = currentNodes.map(node => ({ ...node, fx: 0, fy: 0 }));

            // Repulsion force
            for (const nodeA of updatedNodes) {
                for (const nodeB of updatedNodes) {
                    if (nodeA.id === nodeB.id) continue;
                    const dx = nodeA.x - nodeB.x;
                    const dy = nodeA.y - nodeB.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < 1) distance = 1;
                    const force = -20 / (distance * distance);
                    nodeA.vx += (dx / distance) * force;
                    nodeA.vy += (dy / distance) * force;
                }
            }

            // Link force (spring)
            for (const link of newLinks) {
                const source = updatedNodes.find(n => n.id === link.source);
                const target = updatedNodes.find(n => n.id === link.target);
                if (!source || !target) continue;
                
                const dx = target.x - source.x;
                const dy = target.y - source.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const force = 0.03 * (distance - (100 / link.strength));
                
                source.vx += (dx / distance) * force;
                source.vy += (dy / distance) * force;
                target.vx -= (dx / distance) * force;
                target.vy -= (dy / distance) * force;
            }
            
            // Apply forces and gravity
            return updatedNodes.map(node => {
                // Gravity towards center
                node.vx += (width / 2 - node.x) * 0.005;
                node.vy += (height / 2 - node.y) * 0.005;
                
                // Damping
                node.vx *= 0.9;
                node.vy *= 0.9;
                
                node.x += node.vx;
                node.y += node.vy;

                // Boundary collision
                node.x = Math.max(node.radius, Math.min(width - node.radius, node.x));
                node.y = Math.max(node.radius, Math.min(height - node.radius, node.y));
                
                return node;
            });
        });

        currentIteration++;
        simulationFrame = requestAnimationFrame(simulate);
    };

    simulationFrame = requestAnimationFrame(simulate);

    return () => cancelAnimationFrame(simulationFrame);
  }, [documents, width, height]);

  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  return (
    <div ref={containerRef} className="bg-base-100 dark:bg-dark-base-300 rounded-xl shadow-md p-4 border border-base-300 dark:border-slate-700 relative min-h-[500px]">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-base-100/80 dark:bg-dark-base-300/80 z-10">
          <LoadingSpinner className="w-8 h-8 text-brand-primary" />
          <p className="mt-2 text-slate-500">Building evidence map...</p>
        </div>
      )}
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
            <marker id="arrowhead" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            </marker>
        </defs>
        
        {/* Links */}
        {links.map((link, i) => {
          const source = nodeMap.get(link.source);
          const target = nodeMap.get(link.target);
          if (!source || !target) return null;
          return (
            <line
              key={`${link.source}-${link.target}`}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              strokeOpacity={0.2 + link.strength * 0.1}
              className="stroke-slate-400 dark:stroke-slate-600 transition-all"
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node, i) => (
          <circle
            key={node.id}
            cx={node.x}
            cy={node.y}
            r={node.radius}
            fill={colors[i % colors.length]}
            onClick={() => onNodeClick(`"${node.title}"`)}
            onMouseEnter={() => setHoveredNode(node)}
            onMouseLeave={() => setHoveredNode(null)}
            className="cursor-pointer transition-all hover:stroke-2 hover:stroke-brand-accent"
          />
        ))}

        {/* Hover Tooltip */}
        {hoveredNode && (
            <g transform={`translate(${hoveredNode.x + 10}, ${hoveredNode.y})`} style={{ pointerEvents: 'none' }}>
                <rect x="0" y="-12" width={hoveredNode.title.length * 6 + 10} height="24" fill="rgba(0,0,0,0.7)" rx="4"/>
                <text x="5" y="5" fill="#fff" fontSize="10">{hoveredNode.title}</text>
            </g>
        )}
      </svg>
    </div>
  );
};
