import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from "@iconify/react";

const InfoTooltip = ({ text }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const iconRef = useRef(null);

    const handleMouseEnter = () => {
        if (iconRef.current) {
            const rect = iconRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX + (rect.width / 2)
            });
            setIsVisible(true);
        }
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    return (
        <>
            <div
                className="info-tooltip-container"
                style={{ display: 'inline-block', position: 'relative', marginLeft: '8px', verticalAlign: 'middle' }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                ref={iconRef}
            >
                <Icon
                    icon="mdi:help-circle-outline"
                    style={{ color: '#6c757d', cursor: 'help', fontSize: '1.2em' }}
                />
            </div>

            {isVisible && createPortal(
                <div
                    className="info-tooltip-content"
                    style={{
                        position: 'absolute',
                        top: coords.top - 8, // 8px spacing above the icon
                        left: coords.left,
                        transform: 'translate(-50%, -100%)',
                        backgroundColor: '#333',
                        color: '#fff',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        width: '200px',
                        textAlign: 'center',
                        zIndex: 9999999,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        pointerEvents: 'none',
                        lineHeight: '1.4'
                    }}
                >
                    {text}
                    {/* Arrow */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            marginLeft: '-5px',
                            borderWidth: '5px',
                            borderStyle: 'solid',
                            borderColor: '#333 transparent transparent transparent'
                        }}
                    />
                </div>,
                document.body
            )}
        </>
    );
};

export default InfoTooltip;
