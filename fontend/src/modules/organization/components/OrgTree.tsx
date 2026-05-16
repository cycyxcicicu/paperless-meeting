import React from 'react';
import { 
  Building2, 
  ChevronDown, 
  ChevronRight, 
  Search 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/common/utils/cn'; // I'll assume a cn utility exists or create it

export interface TreeNode {
  id: string;
  name: string;
  code: string;
  children?: TreeNode[];
  isExpanded?: boolean;
  level: number;
}

interface OrgTreeProps {
  treeData: TreeNode[];
  selectedId: string;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}

export const OrgTree: React.FC<OrgTreeProps> = ({ 
  treeData, 
  selectedId, 
  onSelect, 
  onToggle 
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const renderNode = (node: TreeNode) => {
    const isSelected = selectedId === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const paddingLeft = node.level * 16 + 12;

    return (
      <div key={node.id} className="select-none">
        <motion.div
          layout
          initial={false}
          className={cn(
            "group flex items-center gap-2.5 py-2 px-3 mx-2 my-0.5 rounded-lg cursor-pointer transition-all duration-200",
            isSelected 
              ? "bg-[#C8102E]/5 text-[#C8102E] ring-1 ring-[#C8102E]/20 shadow-sm" 
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          )}
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => onSelect(node.id)}
        >
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(node.id);
                }}
                className={cn(
                  "p-0.5 rounded hover:bg-black/5 transition-colors",
                  isSelected ? "text-[#C8102E]" : "text-gray-400"
                )}
              >
                {node.isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 stroke-[2.5]" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
                )}
              </button>
            ) : (
              <div className="w-4.5" />
            )}
            
            <Building2 className={cn(
              "h-4 w-4 shrink-0",
              isSelected ? "text-[#C8102E]" : "text-gray-400 group-hover:text-gray-500"
            )} />
            
            <span className={cn(
              "text-[13px] truncate leading-none py-1",
              isSelected ? "btn-primary" : "body"
            )}>
              {node.name}
            </span>
          </div>
          
          {isSelected && (
            <motion.div 
              layoutId="active-indicator"
              className="w-1.5 h-1.5 rounded-full bg-[#C8102E] shadow-[0_0_8px_rgba(200,16,46,0.4)]"
            />
          )}
        </motion.div>
        
        <AnimatePresence initial={false}>
          {hasChildren && node.isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              {node.children!.map(child => renderNode(child))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-100">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#C8102E] transition-colors" />
          <input
            type="text"
            placeholder="Tìm kiếm đơn vị..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300">
        {treeData.map(node => renderNode(node))}
      </div>
    </div>
  );
};
