import React from 'react';
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  MapPin,
  CheckCheck,
  AlertCircle
} from 'lucide-react';
import { TrackingStep, OrderStatus } from '../types';

interface OrderTimelineProps {
  timeline: TrackingStep[];
  currentStatus: OrderStatus;
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({
  timeline,
  carrier,
  trackingNumber,
  estimatedDelivery
}) => {
  const getStepIcon = (status: OrderStatus, completed: boolean, current: boolean) => {
    if (completed && !current) {
      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    }

    switch (status) {
      case 'Order Placed':
        return <Clock className={`w-5 h-5 ${current ? 'text-indigo-600 animate-pulse' : 'text-slate-400'}`} />;
      case 'Confirmed':
        return <CheckCircle2 className={`w-5 h-5 ${current ? 'text-indigo-600 animate-pulse' : 'text-slate-400'}`} />;
      case 'Processing':
        return <Package className={`w-5 h-5 ${current ? 'text-indigo-600 animate-pulse' : 'text-slate-400'}`} />;
      case 'Shipped':
        return <Truck className={`w-5 h-5 ${current ? 'text-indigo-600 animate-pulse' : 'text-slate-400'}`} />;
      case 'Out for Delivery':
        return <MapPin className={`w-5 h-5 ${current ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`} />;
      case 'Delivered':
        return <CheckCheck className={`w-5 h-5 ${current ? 'text-emerald-500' : 'text-slate-400'}`} />;
      case 'Cancelled':
      default:
        return <AlertCircle className="w-5 h-5 text-rose-500" />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
      {/* Tracking Metadata Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Courier Carrier</span>
          <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
            {carrier || 'FedEx Express Worldwide'}
          </p>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tracking Number</span>
          <p className="text-sm font-mono font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
            {trackingNumber || 'TRK-US-89241094'}
          </p>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Est. Delivery</span>
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {estimatedDelivery || 'In 3-5 Business Days'}
          </p>
        </div>
      </div>

      {/* Horizontal Steps (Desktop) / Vertical Steps (Mobile) */}
      <div className="relative">
        <div className="hidden md:grid grid-cols-6 gap-2 relative">
          {/* Connector Line behind steps */}
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 dark:bg-slate-800 -z-0" />

          {timeline.map((step, idx) => {
            const isCompleted = step.completed;
            const isCurrent = step.current;

            return (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center px-1">
                {/* Node circle */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500'
                      : isCurrent
                      ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-600 shadow-md shadow-indigo-600/30'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {getStepIcon(step.status, isCompleted, isCurrent)}
                </div>

                <h5
                  className={`text-xs font-bold mt-3 leading-tight ${
                    isCurrent
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : isCompleted
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-400'
                  }`}
                >
                  {step.title}
                </h5>

                {step.timestamp && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                    {step.timestamp}
                  </span>
                )}

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Mobile Vertical Stepper */}
        <div className="md:hidden space-y-6 relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 ml-3">
          {timeline.map((step, idx) => {
            const isCompleted = step.completed;
            const isCurrent = step.current;

            return (
              <div key={idx} className="relative group">
                <div
                  className={`absolute -left-[35px] top-0 w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white dark:bg-slate-900 ${
                    isCompleted
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/80'
                      : isCurrent
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/80 shadow-md shadow-indigo-600/30'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {getStepIcon(step.status, isCompleted, isCurrent)}
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h5
                      className={`text-sm font-bold ${
                        isCurrent
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : isCompleted
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.title}
                    </h5>
                    {step.timestamp && (
                      <span className="text-[11px] text-slate-500 font-mono">{step.timestamp}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
