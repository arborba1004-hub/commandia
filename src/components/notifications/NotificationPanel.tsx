import { useNotificationStore } from '@/stores/notificationStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NotificationPanelProps {
  onClose: () => void;
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { notifications, markAsRead, removeNotification, clearAll } = useNotificationStore();

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  return (
    <Card className="w-96 border-2 border-secondary/20 shadow-lg">
      <div className="p-4 border-b border-secondary/20 flex justify-between items-center">
        <h3 className="font-heading text-lg">Notifications</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="hover:bg-secondary/10"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="h-96">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-secondary-foreground/70">
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-secondary/20">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-secondary/5 transition-colors cursor-pointer ${
                  !notification.read ? 'bg-primary/5' : ''
                }`}
                onClick={() => handleMarkAsRead(notification.id)}
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h4 className="font-bold text-sm flex-1">{notification.title}</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notification.id);
                    }}
                    className="hover:bg-destructive/10 h-6 w-6"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-xs text-secondary-foreground/70 mb-2">
                  {notification.message}
                </p>
                <p className="text-xs text-secondary-foreground/50">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {notifications.length > 0 && (
        <div className="p-4 border-t border-secondary/20">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAll}
            className="w-full text-xs"
          >
            <Trash2 className="w-3 h-3 mr-2" />
            Clear All
          </Button>
        </div>
      )}
    </Card>
  );
}
