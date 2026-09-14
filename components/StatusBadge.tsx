import { CheckCircle, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import { MedicineStatus } from '@/types';

interface StatusBadgeProps {
  status: MedicineStatus;
  size?: 'sm' | 'md' | 'lg';
}

const config: Record<MedicineStatus, { label: string; icon: React.ReactNode; classes: string }> = {
  verified: {
    label: 'Verified',
    icon: <CheckCircle className="w-4 h-4" />,
    classes: 'bg-green-100 text-green-700 border border-green-200',
  },
  suspicious: {
    label: 'Suspicious',
    icon: <AlertTriangle className="w-4 h-4" />,
    classes: 'bg-red-100 text-red-700 border border-red-200',
  },
  recalled: {
    label: 'Recalled',
    icon: <XCircle className="w-4 h-4" />,
    classes: 'bg-orange-100 text-orange-700 border border-orange-200',
  },
  unknown: {
    label: 'Unknown',
    icon: <HelpCircle className="w-4 h-4" />,
    classes: 'bg-gray-100 text-gray-600 border border-gray-200',
  },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { label, icon, classes } = config[status] ?? config.unknown;
  const sizeClass = size === 'lg' ? 'text-base px-4 py-1.5' : size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${sizeClass} ${classes}`}>
      {icon}
      {label}
    </span>
  );
}
