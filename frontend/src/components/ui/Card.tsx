interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hoverable?: boolean;
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const shadowStyles = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
};

const roundedStyles = {
  none: '',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
};

const CardComponent: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'md',
  border = true,
  rounded = 'lg',
  hoverable = false,
}) => {
  const defaultCardClass = 'bg-white border border-gray-200';
  return (
    <div
      className={`
        ${defaultCardClass}
        ${paddingStyles[padding]}
        ${shadowStyles[shadow]}
        ${roundedStyles[rounded]}
        ${border ? '' : 'border-none'}
        ${hoverable ? 'transition-shadow duration-200 hover:shadow-lg' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  divider?: boolean;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = '',
  divider = true,
}) => {
  return (
    <div
      className={`
        mb-4
        ${divider ? 'pb-4 border-b border-gray-200' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const titleSizeStyles = {
  sm: 'text-lg font-semibold',
  md: 'text-xl font-semibold',
  lg: 'text-2xl font-bold',
  xl: 'text-3xl font-bold',
};

export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  className = '',
  size = 'md',
}) => {
  return (
    <h3
      className={`
        text-gray-900
        ${titleSizeStyles[size]}
        ${className}
      `}
    >
      {children}
    </h3>
  );
};

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`text-gray-600 ${className}`}>
      {children}
    </div>
  );
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  divider?: boolean;
  justify?: 'start' | 'end' | 'center' | 'between' | 'around';
}

const justifyStyles = {
  start: 'justify-start',
  end: 'justify-end',
  center: 'justify-center',
  between: 'justify-between',
  around: 'justify-around',
};

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
  divider = true,
  justify = 'end',
}) => {
  return (
    <div
      className={`
        mt-4 flex items-center
        ${divider ? 'pt-4 border-t border-gray-200' : ''}
        ${justifyStyles[justify]}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Create compound component with proper TypeScript typing
type CardType = typeof CardComponent & {
  Header: typeof CardHeader;
  Title: typeof CardTitle;
  Body: typeof CardBody;
  Footer: typeof CardFooter;
};

export const Card = CardComponent as CardType;

// Attach sub-components
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Body = CardBody;
Card.Footer = CardFooter;
