// export default function ImageGrid({ images, className }) {
//     return (
//         <div style={{
//             gridTemplateColumns: `repeat(${images?.length > 3 ? 2 : 3}, minmax(0, 1fr))`
//         }} className={`grid gap-8  mt-8 ${className}`}>
//             {images.map((img, index) => (
//                 <div key={index} className="">
//                     <img
//                         src={img}
//                         alt=""
//                         // style={{
//                         //     width: 378,
//                         //     height: 320
//                         // }}
//                         className="rounded-[20px] "
//                     />
//                 </div>
//             ))}
//         </div>
//     );
// }
export default function ImageGrid({ images = [], className = "" }) {
    const isSmallSet = images.length <= 3;

    return (
        <div
            style={{
                gridTemplateColumns: isSmallSet
                    ? "repeat(3, 378px)"
                    : "repeat(2, minmax(0, 1fr))",
            }}
            className={`grid gap-8 mt-8 justify-center ${className}`}
        >
            {images.map((img, index) => (
                <div
                    key={index}
                    className={`overflow-hidden rounded-[20px]
            ${isSmallSet ? "w-[378px] h-80" : "w-full h-80"}
          `}
                >
                    <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                    />
                </div>
            ))}
        </div>
    );
}
