import React, { useState } from "react";
import Image from 'next/image';

const ButtonWalk = () => {
    const [selectedState, setSelectedState] = useState("state1");

    const handleSelect = (state: string) => {
        setSelectedState(state);
    };

    return (
        <div className="flex gap-4">
            {/* Logo 1 */}
            <button
                onClick={() => handleSelect("state1")}
                className={`p-4 border-2 rounded-full ${selectedState === "state1" ? "border-green-500" : "border-gray-300"
                    }`}
            >
                <Image src="/" alt="Logo 1" width={32} height={32} className="w-8 h-8" />
            </button>

            {/* Logo 2 */}
            <button
                onClick={() => handleSelect("state2")}
                className={`p-4 border-2 rounded-full ${selectedState === "state2" ? "border-green-500" : "border-gray-300"
                    }`}
            >
                <Image src="/logo2.png" alt="Logo 2" width={32} height={32} className="w-8 h-8" />
            </button>

            {/* Logo 3 */}
            <button
                onClick={() => handleSelect("state3")}
                className={`p-4 border-2 rounded-full ${selectedState === "state3" ? "border-green-500" : "border-gray-300"
                    }`}
            >
                <Image src="/logo3.png" alt="Logo 3" width={32} height={32} className="w-8 h-8" />
            </button>
        </div>
    );
};

export default ButtonWalk;