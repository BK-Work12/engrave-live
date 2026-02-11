import { useEffect, useState } from "react";

export function useScrollIntoView(ref) {
    const [isInView, setIsInView] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        if (!ref.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting);
            },
            {
                threshold: Array.from({ length: 101 }, (_, i) => i / 100),
            }
        );

        observer.observe(ref.current);

        return () => observer.disconnect();
    }, [ref]);

    useEffect(() => {
        if (!isInView) return;

        const handleScroll = () => {
            const rect = ref.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            // 0 → not visible, 1 → fully passed
            const progress = Math.min(
                Math.max((windowHeight - rect.top) / (windowHeight + rect.height), 0),
                1
            );

            setScrollProgress(progress);
        };

        window.addEventListener("scroll", handleScroll);
        handleScroll(); // initial

        return () => window.removeEventListener("scroll", handleScroll);
    }, [isInView, ref]);

    return { isInView, scrollProgress };
}
