import { Search } from 'lucide-react';
import { Badge } from '@/common/components/ui/badge';

interface AgentActivityBadgeProps {
  agentsUsed?: string[];
}

export function AgentActivityBadge({ agentsUsed }: AgentActivityBadgeProps) {
  if (!agentsUsed || agentsUsed.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {agentsUsed.map((agent) => (
        <Badge key={agent} variant="info" className="text-[10px] font-medium gap-1">
          <Search className="h-3 w-3" />
          {agent}
        </Badge>
      ))}
    </div>
  );
}
