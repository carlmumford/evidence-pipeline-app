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

const getDocumentTags = (doc: Document): string[] => [
    ...doc.subjects,
    ...doc.riskFactors,
    ...doc.keyPopulations,
    ...doc.interventions,
];

export const EvidenceMap: React.FC<EvidenceMapProps> = ({ documents, onNodeClick }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
        setDimensions({
            width: containerRef.current.clientWidth,
            height: 500
        });
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const { width, height } = dimensions;

    const initialNodes: Node[] = documents.map((doc) => ({
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
    
    setNodes(initialNodes);
    setLinks(newLinks);

    let simulationFrame: number;
    const iterations = 150;
    let currentIteration = 0;

    const simulate = () => {
        if (currentIteration >= iterations) {
            setIsLoading(false);
            return;
        }

        setNodes(currentNodes => {
            let updatedNodes = JSON.parse(JSON.stringify(currentNodes));

            // Repulsion force
            for (const nodeA of updatedNodes) {
                for (const nodeB of updatedNodes) {
                    if (nodeA.id === nodeB.id) continue;
                    const dx = nodeA.x - nodeB.x;
                    const dy = nodeA.y - nodeB.y;
                    let distance = Math.sqrt(dx * dx + dy * dy) || 1;
                    const force = -20 / (distance * distance);
                    nodeA.vx += (dx / distance) * force;
                    nodeA.vy += (dy / distance) * force;
                }
            }

            // Link force
            for (const link of newLinks) {
                const source = updatedNodes.find((n: Node) => n.id === link.source);
                const target = updatedNodes.find((n: Node) => n.id === link.target);
                if (!source || !target) continue;
                
                const dx = target.x - source.x;
                const dy = target.y - source.y;
                const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = 0.03 * (distance - (100 / link.strength));
                
                source.vx += (dx / distance) * force;
                source.vy += (dy / distance) * force;
                target.vx -= (dx / distance) * force;
                target.vy -= (dy / distance) * force;
            }
            
            return updatedNodes.map((node: Node) => {
                node.vx += (width / 2 - node.x) * 0.005;
                node.vy += (height / 2 - node.y) * 0.005;
                node.vx *= 0.9;
                node.vy *= 0.9;
                node.x += node.vx;
                node.y += node.vy;
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
  }, [documents, dimensions]);

  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  return (
    <div ref={containerRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700 relative min-h-[500px]">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-800/80 z-10">
          <LoadingSpinner className="w-8 h-8 text-accent" />
          <p className="mt-2 text-gray-500">Building evidence map...</p>
        </div>
      )}
      <svg width="100%" height={dimensions.height} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}>
        {links.map((link) => {
          const source = nodeMap.get(link.source);
          const target = nodeMap.get(link.target);
          if (!source || !target) return null;
          return (
            <line
              key={`${link.source}-${link.target}`}
              x1={source.x} y1={source.y}
              x2={target.x} y2={target.y}
              strokeOpacity={0.2 + link.strength * 0.1}
              className="stroke-gray-400 dark:stroke-gray-600 transition-all"
            />
          );
        })}

        {nodes.map((node) => (
          <circle
            key={node.id}
            cx={node.x} cy={node.y}
            r={node.radius}
            fill={colors[Number(node.id.replace(/\D/g,'')) % colors.length]}
            onClick={() => onNodeClick(`"${node.title}"`)}
            onMouseEnter={() => setHoveredNode(node)}
            onMouseLeave={() => setHoveredNode(null)}
            className="cursor-pointer transition-all hover:stroke-2 hover:stroke-accent"
          />
        ))}

        {hoveredNode && (
            <g transform={`translate(${hoveredNode.x + 10}, ${hoveredNode.y})`} style={{ pointerEvents: 'none' }}>
                <rect x="0" y="-12" width={hoveredNode.title.length * 6 + 10} height="24" fill="rgba(17,17,17,0.8)" rx="4"/>
                <text x="5" y="4" fill="#fff" fontSize="10px">{hoveredNode.title}</text>
            </g>
        )}
      </svg>
    </div>
  );
};