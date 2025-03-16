# Accessibility Implementation Guide

This document outlines the accessibility improvements implemented in the dance school management application to ensure WCAG 2.1 AA compliance.

## Why Accessibility Matters

Making our application accessible ensures that:

1. Users with disabilities can use the application effectively
2. We comply with legal requirements (ADA, Section 508, etc.)
3. We improve the overall user experience for everyone
4. We reach a wider audience

## Key Implementations

### 1. Semantic HTML

We've replaced generic `<div>` elements with semantic HTML tags that correctly describe their purpose:

```jsx
// Before
<div className="header">...</div>
<div className="navigation">...</div>
<div className="main-content">...</div>

// After
<header>...</header>
<nav>...</nav>
<main>...</main>
```

### 2. ARIA Attributes

We've added appropriate ARIA attributes to enhance screen reader compatibility:

```jsx
// Form labels and associations
<div className="formGroup">
  <label htmlFor="firstName">First Name</label>
  <input 
    id="firstName"
    aria-required="true" 
    aria-invalid={!!errors.firstName}
    aria-describedby={errors.firstName ? "firstName-error" : undefined}
  />
  {errors.firstName && (
    <div id="firstName-error" role="alert">
      {errors.firstName}
    </div>
  )}
</div>

// Dynamic content updates
<div aria-live="polite" role="status">
  {statusMessage}
</div>

// Landmarks and regions
<nav aria-label="Main navigation">...</nav>
<section aria-labelledby="section-heading">
  <h2 id="section-heading">Student Management</h2>
  ...
</section>
```

### 3. Keyboard Navigation

We've ensured all interactive elements are keyboard accessible:

```jsx
// Focus management
const firstInputRef = useRef(null);

useEffect(() => {
  // Focus the first input when the form loads
  firstInputRef.current?.focus();
}, []);

// Keyboard handlers
const handleKeyDown = (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    handleClick();
  }
};

<div 
  role="button" 
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={handleKeyDown}
>
  Click Me
</div>
```

### 4. Focus Management

We've implemented proper focus management for modals and dynamic content:

```jsx
function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef(null);
  const previousFocus = useRef(null);
  
  useEffect(() => {
    if (isOpen) {
      // Save the currently focused element
      previousFocus.current = document.activeElement;
      
      // Focus the modal
      modalRef.current?.focus();
      
      // Trap focus inside modal
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      const handleTabKey = (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };
      
      document.addEventListener('keydown', handleTabKey);
      
      return () => {
        document.removeEventListener('keydown', handleTabKey);
        // Restore focus when modal closes
        previousFocus.current?.focus();
      };
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      className="modal"
    >
      <button onClick={onClose} aria-label="Close modal">×</button>
      {children}
    </div>
  );
}
```

### 5. Color Contrast

We've ensured all text has sufficient contrast against its background:

```css
/* High contrast text */
.primary-text {
  color: #333333; /* Dark gray on white - 12:1 contrast ratio */
}

/* Accessible form error states */
.error-message {
  color: #d32f2f; /* WCAG AA compliant red */
  background-color: #ffebee; /* Light pink background */
  border: 1px solid #f5c6cb;
}

/* Status indicators with sufficient contrast */
.status-enrolled {
  background-color: #e6f4ea;
  color: #137333; /* 5.7:1 contrast ratio */
}
```

### 6. Responsive Design

We've made the application responsive and accessible on mobile devices:

```css
/* Base styles for all devices */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
  }
  
  .button {
    width: 100%; /* Full width buttons on mobile */
    min-height: 44px; /* Larger touch target */
  }
  
  /* Increased spacing for touch targets */
  .nav-item {
    padding: 12px 16px;
    margin: 8px 0;
  }
}
```

### 7. Form Validation and Error Handling

We've implemented accessible form validation and error messaging:

```jsx
function AccessibleForm() {
  const [errors, setErrors] = useState({});
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }
    
    // Set errors and announce to screen readers
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      // Announce errors to screen readers
      document.getElementById('form-status').textContent = 
        'Form contains errors. Please correct them and try again.';
      
      // Focus the first field with an error
      document.getElementById(Object.keys(newErrors)[0])?.focus();
      
      return false;
    }
    
    return true;
  };
  
  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Hidden status for screen readers */}
      <div id="form-status" role="status" className="sr-only" aria-live="polite"></div>
      
      {/* Form fields with validation */}
      <div className="form-field">
        <label htmlFor="name">Name</label>
        <input 
          id="name"
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
          value={formData.name}
          onChange={handleChange}
        />
        {errors.name && (
          <div id="name-error" className="error-message" role="alert">
            {errors.name}
          </div>
        )}
      </div>
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

### 8. Skip Navigation Link

We've added a skip navigation link to help keyboard users bypass repetitive navigation:

```jsx
function Layout() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      <header>...</header>
      <nav>...</nav>
      
      <main id="main-content">
        {/* Main content */}
      </main>
    </>
  );
}

// CSS for the skip link
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #4a90e2;
  color: white;
  padding: 8px;
  z-index: 100;
  
  /* Show on focus for keyboard users */
  &:focus {
    top: 0;
  }
}
```

## Testing Accessibility

We've implemented the following testing procedures:

1. **Automated testing** with tools like jest-axe:

```jsx
import { axe } from 'jest-axe';

test('component has no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

2. **Screen reader testing** with:
   - NVDA or JAWS on Windows
   - VoiceOver on macOS/iOS
   - TalkBack on Android

3. **Keyboard navigation testing** to ensure all functionality can be accessed with keyboard only

4. **Color contrast testing** using the WebAIM contrast checker or browser developer tools

## WCAG 2.1 AA Compliance Checklist

We've focused on meeting these key WCAG 2.1 AA requirements:

- **1.1 Text Alternatives**: All images have appropriate alt text
- **1.3 Adaptable**: Information is presented in a way that can be perceived in different forms
- **1.4 Distinguishable**: Content is easy to see and hear
- **2.1 Keyboard Accessible**: All functionality is available from a keyboard
- **2.4 Navigable**: Users can navigate, find content, and determine where they are
- **3.1 Readable**: Text content is readable and understandable
- **3.2 Predictable**: Web pages appear and operate in predictable ways
- **3.3 Input Assistance**: Users are helped to avoid and correct mistakes
- **4.1 Compatible**: Content is compatible with current and future user tools

## Accessibility Components Library

We've created reusable accessible components that can be used throughout the application:

1. `AccessibleTable` - For data tables with proper headers and ARIA attributes
2. `AccessibleForm` - For form inputs with validation and error handling
3. `Pagination` - For accessible pagination controls
4. `Modal` - For accessible modal dialogs with focus management
5. `Tabs` - For accessible tabbed interfaces

These components can be found in the `src/components/accessibility/` directory.

## Resources

- [WebAIM](https://webaim.org/) - Web accessibility information and resources
- [WAI-ARIA Authoring Practices](https://www.w3.org/TR/wai-aria-practices/) - Patterns for accessible components
- [a11y Project Checklist](https://www.a11yproject.com/checklist/) - Accessibility checklist
- [Axe DevTools](https://www.deque.com/axe/) - Automated accessibility testing tool
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility) - Mozilla's accessibility documentation