'use client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSounds } from '@/contexts/SoundContext';
import type { MessageInfo } from "@/types";

interface MessageBoxProps {
  messageInfo: MessageInfo | null;
  isOpen: boolean;
  onClose: () => void; // This is called when the dialog's open state changes (e.g. overlay click)
}

export default function MessageBox({ messageInfo, isOpen, onClose }: MessageBoxProps) {
  const { playGeneralClickSound } = useSounds();

  if (!messageInfo) return null;

  const handleActionClick = () => {
    playGeneralClickSound();
    if (messageInfo.onClose) {
      messageInfo.onClose(); // Call the specific onClose for this message if provided
    }
    onClose(); // This will set isOpen to false in the parent, closing the dialog
  };
  
  let titleColorClass = "text-primary";
  if (messageInfo.type === "success") titleColorClass = "text-accent-success";
  if (messageInfo.type === "error") titleColorClass = "text-accent-error";

  return (
    <AlertDialog open={isOpen} onOpenChange={(openState) => { if(!openState) onClose(); }}>
      <AlertDialogContent className="bg-panel">
        <AlertDialogHeader>
          <AlertDialogTitle className={titleColorClass}>{messageInfo.title}</AlertDialogTitle>
          <AlertDialogDescription dangerouslySetInnerHTML={{ __html: messageInfo.text.replace(/\n/g, '<br />') }} />
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction 
            onClick={handleActionClick} 
            className="action-btn bg-primary hover:bg-primary/90 btn-primary-text"
          >
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
