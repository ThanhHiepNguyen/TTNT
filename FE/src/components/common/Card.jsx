const Card = ({ children, className = "", padding = "p-6" }) => {
    return (
        <div className={`bg-white rounded-lg shadow-sm ${padding} ${className}`}>
            {children}
        </div>
    );
};

export default Card;

