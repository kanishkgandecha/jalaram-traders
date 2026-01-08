/**
 * Card Component
 * ===============
 * Container component with consistent styling
 */

import { type HTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
}

const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
};

export function Card({
    children,
    padding = 'md',
    hover = false,
    className,
    ...props
}: CardProps) {
    return (
        <div
            className={clsx(
                'bg-white rounded-xl shadow-sm border border-green-100',
                paddings[padding],
                hover && 'hover:shadow-md hover:border-green-200 transition-shadow duration-200',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={clsx('border-b border-gray-100 pb-4 mb-4', className)} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3 className={clsx('text-lg font-semibold text-gray-900', className)} {...props}>
            {children}
        </h3>
    );
}

export default Card;
