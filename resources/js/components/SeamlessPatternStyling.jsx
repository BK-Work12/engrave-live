import React from 'react';
import RangeBox from './RangeBox';
import PosToggler from './PosToggler';
import PrimaryButton from './PrimaryButton';
import { usePage } from '@inertiajs/react';

export default function SeamlessPatternStyling({ settings, updateSetting, onDownload, showDownload = true }) {
    const { auth } = usePage().props;
    const hasCredits = auth.user?.credits > 0;

    return (
        <div className="px-4 w-full lg:w-auto">
            <div className="bg-[#171616] px-4 pt-4 pb-2 mx-auto rounded-[30px] min-w-[300px]" >
                <div className="flex flex-col pb-2">
                    <RangeBox
                        title="Scale"
                        value={settings?.scale}
                        onChange={(val) => updateSetting('scale', val)}
                        svg={
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
                                <path d="M10.083 1.83333C6.36586 1.84002 4.41938 1.93129 3.17544 3.17523C1.83301 4.51765 1.83301 6.67826 1.83301 10.9994C1.83301 15.3207 1.83301 17.4813 3.17544 18.8237C4.51786 20.1661 6.67847 20.1661 10.9997 20.1661C15.3208 20.1661 17.4815 20.1661 18.8239 18.8237C20.0679 17.5797 20.1591 15.6333 20.1658 11.9161" stroke="#FEFEFE" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M11.9157 10.0833L20.1657 1.83333M20.1657 1.83333H15.2672M20.1657 1.83333V6.73177M19.249 2.75L10.999 11M10.999 11H14.6657M10.999 11V7.33333" stroke="#FEFEFE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        }
                        max={3} min={0.01} step={0.01}
                    />
                    <RangeBox
                        title="Rotation"
                        value={settings?.rotation}
                        onChange={(val) => updateSetting('rotation', val)}
                        svg={
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
                                <path d="M3.21669 13.7415C3.81109 15.4284 4.9377 16.8766 6.42676 17.8677C7.91583 18.8588 9.68672 19.3391 11.4725 19.2363C13.2583 19.1336 14.9624 18.4532 16.3279 17.2979C17.6934 16.1425 18.6464 14.5746 19.0433 12.8306C19.4402 11.0865 19.2596 9.26071 18.5285 7.62829C17.7975 5.99583 16.5556 4.64517 14.9901 3.77981C13.4246 2.91446 11.6202 2.58127 9.84897 2.83047C6.85837 3.25119 4.88253 5.4188 2.74902 7.33333M2.74902 7.33333V1.83333M2.74902 7.33333H8.24902" stroke="#FEFEFE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        }
                        max={360} min={0} step={1}
                    />
                    <RangeBox
                        title="Position X"
                        value={settings?.posX}
                        onChange={(val) => updateSetting('posX', val)}
                        svg={
                            <svg xmlns="http://www.w3.org/2000/svg" width="23" height="22" viewBox="0 0 23 22" fill="none">
                                <path d="M5.0655 11.1586H21.64M21.64 11.1586L16.8935 6.08906M21.64 11.1586L16.8936 16.2282M19.8636 11.1586H3.28906M3.28906 11.1586L6.84194 14.9534M3.28906 11.1586L6.84194 7.3639" stroke="#FEFEFE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        }
                        max={200} min={0} step={1}
                    />
                    <RangeBox
                        title="Position Y"
                        value={settings?.posY}
                        onChange={(val) => updateSetting('posY', val)}
                        svg={
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
                                <path d="M11.1594 18.5576L11.1594 1.98313M11.1594 1.98313L6.08984 6.7296M11.1594 1.98313L16.2289 6.72955M11.1594 3.75957L11.1594 20.3341M11.1594 20.3341L14.9542 16.7812M11.1594 20.3341L7.36468 16.7812" stroke="#FEFEFE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        }
                        max={200} min={0} step={1}
                    />
                    <RangeBox
                        title="Stagger"
                        value={settings?.stagger}
                        onChange={(val) => updateSetting('stagger', val)}
                        svg={
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
                                <path d="M7 11.5H16V17.5H7V11.5Z" stroke="#FEFEFE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M3 4.5H9V11.5H3V4.5Z" stroke="#FEFEFE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M14 4.5H20V11.5H14V4.5Z" stroke="#FEFEFE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        }
                        max={100} min={0} step={1}
                    />
                    <RangeBox
                        title="Outline Offset"
                        value={settings?.outlineOffset}
                        onChange={(val) => updateSetting('outlineOffset', val)}
                        svg={
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
                                <path d="M5.92715 16.3905L17.6471 4.67058M17.6471 4.67058L10.7061 4.44211M17.6471 4.67058L17.8756 11.6115M16.391 5.92671L4.67102 17.6467M4.67102 17.6467L9.86657 17.8177M4.67102 17.6467L4.5 12.4511" stroke="#FEFEFE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        }
                        max={50} min={0} step={1}
                    />
                </div>
                <div className="mt-9 mb-7.5 flex flex-col gap-4">
                    <PosToggler
                        text="Tile Horizontally"
                        checked={settings?.tileH}
                        onChange={(val) => updateSetting('tileH', val)}
                    />
                    <PosToggler
                        text="Tile Vertically"
                        checked={settings?.tileV}
                        onChange={(val) => updateSetting('tileV', val)}
                    />
                    <PosToggler
                        text="Invert Colors"
                        checked={settings?.invert}
                        onChange={(val) => updateSetting('invert', val)}
                    />
                </div>
                {showDownload && (
                    <>
                        <PrimaryButton
                            text={hasCredits ? "Download SVG" : "Not Enough Tokens"}
                            disabled={!hasCredits}
                            onClick={onDownload}
                            className="w-full"
                        />
                        <span className="text-xs text-[#808080] mt-1 flex justify-center">Each download costs 1 credit</span>
                    </>
                )}
                <div className="text-center mt-2 text-xs text-[#C459C6]">
                    Available: {auth.user?.credits || 0} Credits
                </div>
            </div>
        </div>
    )
}
