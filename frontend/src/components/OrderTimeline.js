import React from 'react';

const ORDER_STAGES = [
  {
    status: 'Order Received',
    title: 'Order Received',
    desc: 'Order successfully placed and payment confirmed.',
    icon: '📋',
  },
  {
    status: 'In Kitchen',
    title: 'In Kitchen',
    desc: 'Pizza is being prepared by the kitchen staff.',
    icon: '👨‍🍳',
  },
  {
    status: 'Sent for Delivery',
    title: 'Sent for Delivery',
    desc: 'Order has left the restaurant and is on the way.',
    icon: '🛵',
  },
  {
    status: 'Delivered',
    title: 'Delivered',
    desc: 'Order has been successfully delivered. Enjoy! 🎉',
    icon: '✅',
  },
];

// Map legacy/alternate status strings to canonical stage
const STATUS_ALIAS = {
  'order received': 'Order Received',
  'order confirmed': 'Order Received',
  'in kitchen': 'In Kitchen',
  'in the kitchen': 'In Kitchen',
  'baking': 'In Kitchen',
  'packaging': 'Sent for Delivery',
  'out for delivery': 'Sent for Delivery',
  'sent for delivery': 'Sent for Delivery',
  'delivered': 'Delivered',
};

function normalize(status) {
  if (!status) return 'Order Received';
  const lower = status.toLowerCase().trim();
  return STATUS_ALIAS[lower] || 'Order Received';
}

export default function OrderTimeline({ currentStatus }) {
  const canonical = normalize(currentStatus);
  const currentIndex = Math.max(
    ORDER_STAGES.findIndex((s) => s.status === canonical),
    0
  );

  return (
    <div className="order-timeline-container">
      {ORDER_STAGES.map((stage, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        const isFuture = index > currentIndex;
        const isLast = index === ORDER_STAGES.length - 1;

        return (
          <div
            key={stage.status}
            className={[
              'timeline-step',
              isCompleted ? 'completed' : '',
              isActive ? 'active' : '',
              isFuture ? 'future' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {/* Icon column */}
            <div className="timeline-icon-col">
              <div className="timeline-icon-circle">
                {isCompleted ? '✓' : stage.icon}
              </div>
              {!isLast && (
                <div className={`timeline-connector${isCompleted ? ' connected' : ''}`} />
              )}
            </div>

            {/* Content */}
            <div className="timeline-content">
              <div className="timeline-title-row">
                <h3 className="timeline-title">{stage.title}</h3>
                {isActive && (
                  <span className="timeline-badge">Current</span>
                )}
              </div>
              <p className="timeline-desc">{stage.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
