import { Link } from "react-router-dom";

const EmptyState = ({
    icon,
    title,
    description,
    actionLabel,
    actionLink,
    onAction,
}) => {
    return (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            {icon && <div className="mb-4 flex justify-center">{icon}</div>}
            <h2 className="text-xl font-semibold text-gray-700 mb-2">{title}</h2>
            {description && (
                <p className="text-gray-500 mb-6">{description}</p>
            )}
            {actionLink && (
                <Link
                    to={actionLink}
                    className="inline-block px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                >
                    {actionLabel}
                </Link>
            )}
            {onAction && (
                <button
                    onClick={onAction}
                    className="inline-block px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;

