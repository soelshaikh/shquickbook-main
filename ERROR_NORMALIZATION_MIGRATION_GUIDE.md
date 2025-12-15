# Error Normalization Migration Guide

## Quick Start for Developers

This guide shows how to migrate existing error handling to use the new centralized error normalization layer.

---

## ✅ Before vs After Examples

### **Example 1: React Query Mutations**

#### Before:
```typescript
const { mutate } = useCreateInvoice();

mutate(data, {
  onError: (error: any) => {
    toast({
      title: 'Error',
      description: error.message || 'Failed to create invoice',
      variant: 'destructive',
    });
  }
});
```

#### After:
```typescript
import { showErrorToast, showSuccessToast } from '@/lib/errorDisplay';

const { mutate } = useCreateInvoice();

mutate(data, {
  onSuccess: () => {
    showSuccessToast('Invoice created successfully');
  },
  onError: (error) => {
    showErrorToast(error); // Automatically normalized!
  }
});
```

---

### **Example 2: Try-Catch Blocks**

#### Before:
```typescript
async function handleDelete(id: string) {
  try {
    await deleteInvoice(id);
    toast({ title: 'Success', description: 'Invoice deleted' });
  } catch (error: any) {
    toast({
      title: 'Error',
      description: error.message || 'Failed to delete invoice',
      variant: 'destructive',
    });
  }
}
```

#### After:
```typescript
import { showErrorToast, showSuccessToast } from '@/lib/errorDisplay';

async function handleDelete(id: string) {
  try {
    await deleteInvoice(id);
    showSuccessToast('Invoice deleted');
  } catch (error) {
    showErrorToast(error, { title: 'Delete Failed' });
  }
}
```

---

### **Example 3: Inline Error Display**

#### Before:
```typescript
function ErrorMessage({ error }: { error: any }) {
  return (
    <Alert variant="destructive">
      <AlertDescription>
        {error?.message || 'An error occurred'}
      </AlertDescription>
    </Alert>
  );
}
```

#### After:
```typescript
import { getErrorMessage, getErrorDetails } from '@/lib/errorDisplay';

function ErrorMessage({ error }: { error: unknown }) {
  const normalized = getErrorDetails(error);
  
  return (
    <Alert variant={normalized.severity === 'error' ? 'destructive' : 'default'}>
      <AlertDescription>
        {normalized.message}
      </AlertDescription>
    </Alert>
  );
}

// Or simpler version:
function ErrorMessage({ error }: { error: unknown }) {
  return (
    <Alert variant="destructive">
      <AlertDescription>
        {getErrorMessage(error)}
      </AlertDescription>
    </Alert>
  );
}
```

---

### **Example 4: Form Validation Errors**

#### Before:
```typescript
const handleSubmit = async (data: FormData) => {
  if (!data.customerName) {
    toast({
      title: 'Validation Error',
      description: 'Customer name is required',
      variant: 'destructive',
    });
    return;
  }
  // ...
};
```

#### After:
```typescript
import { showWarningToast } from '@/lib/errorDisplay';
import { createNormalizedError } from '@/lib/errorNormalization';

const handleSubmit = async (data: FormData) => {
  if (!data.customerName) {
    const error = createNormalizedError(
      'VALIDATION_ERROR',
      'Customer name is required',
      'warning'
    );
    showWarningToast(error.message);
    return;
  }
  // ...
};

// Or even simpler:
const handleSubmit = async (data: FormData) => {
  if (!data.customerName) {
    showWarningToast('Customer name is required');
    return;
  }
  // ...
};
```

---

### **Example 5: ErrorBoundary Fallback**

#### Before:
```typescript
<ErrorBoundary
  fallback={(error) => (
    <div>Error: {error?.message || 'Unknown error'}</div>
  )}
>
  <Component />
</ErrorBoundary>
```

#### After:
```typescript
import { FeatureErrorFallback } from '@/components/shared/FeatureErrorFallback';

<ErrorBoundary
  fallback={(error) => (
    <FeatureErrorFallback 
      featureName="Component" 
      error={error} 
    />
  )}
>
  <Component />
</ErrorBoundary>

// Or use pre-configured fallbacks:
<ErrorBoundary fallback={InvoicesErrorFallback}>
  <InvoiceList />
</ErrorBoundary>
```

---

## 🎯 Migration Priority

### **High Priority (Migrate First)**
1. ✅ **React Query mutations** - High visibility, user-facing
2. ✅ **API error handling** - Most likely to break with backend changes
3. ✅ **Form submissions** - Direct user interaction

### **Medium Priority**
4. ✅ **Component-level error displays** - Improve consistency
5. ✅ **Utility functions** - Prevent cascading issues

### **Low Priority (Optional)**
6. ⚠️ **Existing stable code** - Only if touching the code anyway
7. ⚠️ **Legacy components** - Can stay as-is if working

---

## 🚀 Quick Reference

### **Import Statements**

```typescript
// Display helpers (most common)
import { 
  showErrorToast, 
  showSuccessToast, 
  showWarningToast,
  getErrorMessage 
} from '@/lib/errorDisplay';

// Core normalization (advanced usage)
import { 
  normalizeError, 
  createNormalizedError,
  type NormalizedError 
} from '@/lib/errorNormalization';
```

### **Common Patterns**

```typescript
// 1. Show error toast
catch (error) {
  showErrorToast(error);
}

// 2. Show error toast with custom title
catch (error) {
  showErrorToast(error, { title: 'Operation Failed' });
}

// 3. Show success toast
onSuccess: () => {
  showSuccessToast('Operation completed');
}

// 4. Get error message for display
const message = getErrorMessage(error);

// 5. Get full error details
const details = getErrorDetails(error);
console.log(details.code, details.severity);

// 6. Create custom error
const error = createNormalizedError(
  'CUSTOM_ERROR',
  'Something specific happened',
  'warning'
);
```

---

## 🔍 When to Use What

| Use Case | Function | Example |
|----------|----------|---------|
| Show error to user | `showErrorToast()` | API errors, validation failures |
| Show success message | `showSuccessToast()` | Successful operations |
| Show warning | `showWarningToast()` | Non-critical issues |
| Display error in component | `getErrorMessage()` | Alert components, error pages |
| Need error details | `getErrorDetails()` | Advanced error display |
| Create custom error | `createNormalizedError()` | Business logic errors |
| Raw normalization | `normalizeError()` | Advanced scenarios |

---

## 💡 Tips

### **Tip 1: Let Normalization Handle It**
Don't manually check error properties - let normalization extract them:

```typescript
// ❌ Don't do this
const message = error?.response?.data?.message || error?.message || 'Error';

// ✅ Do this
const message = getErrorMessage(error);
```

### **Tip 2: Use Type 'unknown' for Errors**
Follow TypeScript best practices:

```typescript
// ❌ Don't do this
catch (error: any) { ... }

// ✅ Do this
catch (error) { // TypeScript defaults to 'unknown'
  showErrorToast(error); // Works with unknown!
}
```

### **Tip 3: Leverage Severity**
Use severity for conditional display:

```typescript
const details = getErrorDetails(error);

const variant = details.severity === 'error' ? 'destructive' : 'default';
const icon = details.severity === 'error' ? <AlertCircle /> : <Info />;
```

### **Tip 4: Development vs Production**
Error details automatically log in development:

```typescript
// Automatically logs detailed error info in development
showErrorToast(error);

// In production: clean user-facing message only
// In development: full error details in console
```

---

## 🧪 Testing Your Migration

### **Checklist:**
- ✅ TypeScript compiles without errors
- ✅ Error toasts display with correct messages
- ✅ Severity affects toast appearance appropriately
- ✅ Development console shows detailed error info
- ✅ Production hides sensitive error details
- ✅ No 'undefined' or '[object Object]' in error messages

### **Test Different Error Shapes:**

```typescript
// Test with different error types
showErrorToast(new Error('Native error'));
showErrorToast('String error');
showErrorToast({ response: { status: 404, data: { message: 'Not found' } } });
showErrorToast(null); // Should show default message

// All should display clean, user-friendly messages
```

---

## 📚 Additional Resources

- **Full Implementation Docs:** `ERROR_NORMALIZATION_IMPLEMENTATION.md`
- **API Reference:** See `src/lib/errorNormalization.ts` JSDoc comments
- **Test Examples:** `src/lib/__tests__/errorNormalization.test.ts`
- **Usage Examples:** `ERROR_NORMALIZATION_IMPLEMENTATION.md` (Usage Patterns section)

---

## ❓ FAQ

### **Q: Do I need to migrate all existing code?**
A: No. The new system works alongside existing error handling. Migrate gradually, starting with high-priority areas.

### **Q: What if I need the original error?**
A: Use `normalizeError()` directly - it preserves the original in `metadata.originalError`:

```typescript
const normalized = normalizeError(error);
console.log(normalized.metadata?.originalError);
```

### **Q: Can I customize error messages?**
A: Yes, use `createNormalizedError()` for custom errors:

```typescript
const error = createNormalizedError(
  'CUSTOM_CODE',
  'Your custom message',
  'warning'
);
```

### **Q: What about backend-specific error formats?**
A: The normalization layer handles them automatically. If a new format appears, update `normalizeError()` in ONE place - all UI updates automatically.

### **Q: Does this change how errors are thrown?**
A: No. This only affects how errors are displayed. Error throwing and catching remain unchanged.

---

## 🎉 Benefits Recap

✅ **Consistency** - All errors display uniformly  
✅ **Future-proof** - Backend changes won't break frontend  
✅ **Type-safe** - Full TypeScript support  
✅ **DX** - Simpler, cleaner code  
✅ **UX** - Better error messages for users  
✅ **Debugging** - Structured logging in development  

**Start migrating today! Begin with your most user-facing error handling.**
