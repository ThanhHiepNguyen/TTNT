const Loading = ({ size = "md", fullScreen = false }) => {
    const sizeClasses = {
        sm: "h-6 w-6",
        md: "h-12 w-12",
        lg: "h-16 w-16",
    };

    const spinner = (
        <div className={`animate-spin rounded-full border-b-2 border-amber-600 ${sizeClasses[size]}`}></div>
    );

    if (fullScreen) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                {spinner}
            </div>
        );
    }

    return <div className="flex justify-center items-center p-4">{spinner}</div>;
};

export default Loading;

