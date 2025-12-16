import React from 'react';
import { X, Dog } from 'lucide-react';
import { LoginStage, Route } from '../types';

interface MascotCompanionProps {
    showBookingModal: boolean;
    view: Route;
    loginStage: LoginStage;
    session: any;
    mascotMessage: string;
    showMascotBubble: boolean;
    setShowMascotBubble: (show: boolean) => void;
    onOpenChat: () => void;
}

export const MascotCompanion: React.FC<MascotCompanionProps> = ({
    showBookingModal,
    view,
    loginStage,
    session,
    mascotMessage,
    showMascotBubble,
    setShowMascotBubble,
    onOpenChat
}) => {
    // Se o modal estiver aberto, ou já estiver no chat, ou no fluxo de login, esconde o mascote
    if (showBookingModal || view === 'chat' || loginStage !== 'idle') return null;
    
    return (
        <div className="mascot-container fade-in-slide">
            {showMascotBubble && mascotMessage && (
                <div className="speech-bubble pop-in">
                    {mascotMessage}
                    <button className="bubble-close" onClick={(e) => { e.stopPropagation(); setShowMascotBubble(false); }}>
                        <X size={10} />
                    </button>
                </div>
            )}
            <div 
                className="mascot-icon-wrapper"
                onClick={onOpenChat}
                onMouseEnter={() => setShowMascotBubble(true)}
                title="Falar com Assistente IA"
            >
                <Dog size={24} color="white" strokeWidth={2.5} />
            </div>
        </div>
    );
};