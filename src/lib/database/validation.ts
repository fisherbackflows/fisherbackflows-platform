import { z } from 'zod';
import { handleError, ErrorCategory, ErrorSeverity, ValidationError } from '../error-handling/error-manager';
import { logger } from '../logger';
import { supabase } from '../supabase';

export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export interface DatabaseConstraints {
  tableName: string;
  uniqueConstraints: Array<{
    fields: string[];
    message: string;
  }>;
  foreignKeyConstraints: Array<{
    field: string;
    referencedTable: string;
    referencedField: string;
    message: string;
  }>;
  checkConstraints: Array<{
    field: string;
    condition: (value: any) => boolean;
    message: string;
  }>;
}

class DatabaseValidator {
  private constraints = new Map<string, DatabaseConstraints>();
  private schemaCache = new Map<string, z.ZodSchema>();

  registerTableConstraints(constraints: DatabaseConstraints): void {
    this.constraints.set(constraints.tableName, constraints);
  }

  registerSchema(tableName: string, schema: z.ZodSchema): void {
    this.schemaCache.set(tableName, schema);
  }

  async validateAndSanitize<T>(
    tableName: string,
    data: any,
    operation: 'INSERT' | 'UPDATE' | 'DELETE' = 'INSERT'
  ): Promise<ValidationResult<T>> {
    try {
      // Schema validation first
      const schemaResult = await this.validateSchema(tableName, data);
      if (!schemaResult.success) {
        return schemaResult;
      }

      const sanitizedData = schemaResult.data;

      // Database constraint validation
      const constraintResult = await this.validateConstraints(
        tableName,
        sanitizedData,
        operation
      );
      if (!constraintResult.success) {
        return constraintResult;
      }

      // Business rule validation
      const businessResult = await this.validateBusinessRules(
        tableName,
        sanitizedData,
        operation
      );
      if (!businessResult.success) {
        return businessResult;
      }

      return {
        success: true,
        data: sanitizedData
      };

    } catch (error: any) {
      await handleError(error, {
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.HIGH,
        context: {
          tableName,
          operation,
          data: this.sanitizeLogData(data)
        }
      });

      return {
        success: false,
        error: 'Validation failed due to an internal error'
      };
    }
  }

  private async validateSchema(tableName: string, data: any): Promise<ValidationResult> {
    const schema = this.schemaCache.get(tableName);
    if (!schema) {
      return {
        success: true,
        data
      };
    }

    try {
      const validatedData = await schema.parseAsync(data);
      return {
        success: true,
        data: validatedData
      };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        
        error.errors.forEach(err => {
          const path = err.path.join('.');
          fieldErrors[path] = err.message;
        });

        return {
          success: false,
          error: 'Validation failed',
          fieldErrors
        };
      }

      throw error;
    }
  }

  private async validateConstraints(
    tableName: string,
    data: any,
    operation: string
  ): Promise<ValidationResult> {
    const constraints = this.constraints.get(tableName);
    if (!constraints) {
      return { success: true };
    }

    // Validate unique constraints
    for (const uniqueConstraint of constraints.uniqueConstraints) {
      const isValid = await this.validateUniqueConstraint(
        tableName,
        data,
        uniqueConstraint,
        operation
      );
      
      if (!isValid) {
        return {
          success: false,
          error: uniqueConstraint.message
        };
      }
    }

    // Validate foreign key constraints
    for (const fkConstraint of constraints.foreignKeyConstraints) {
      const isValid = await this.validateForeignKeyConstraint(data, fkConstraint);
      
      if (!isValid) {
        return {
          success: false,
          error: fkConstraint.message
        };
      }
    }

    // Validate check constraints
    for (const checkConstraint of constraints.checkConstraints) {
      const fieldValue = data[checkConstraint.field];
      
      if (fieldValue !== undefined && !checkConstraint.condition(fieldValue)) {
        return {
          success: false,
          error: checkConstraint.message,
          fieldErrors: {
            [checkConstraint.field]: checkConstraint.message
          }
        };
      }
    }

    return { success: true };
  }

  private async validateUniqueConstraint(
    tableName: string,
    data: any,
    constraint: { fields: string[]; message: string },
    operation: string
  ): Promise<boolean> {
    try {
      let query = supabase.from(tableName).select('id');
      
      // Build the query for unique constraint check
      constraint.fields.forEach(field => {
        if (data[field] !== undefined) {
          query = query.eq(field, data[field]);
        }
      });

      // For updates, exclude the current record
      if (operation === 'UPDATE' && data.id) {
        query = query.neq('id', data.id);
      }

      const { data: existingRecords, error } = await query;

      if (error) {
        throw new Error(`Unique constraint validation failed: ${error.message}`);
      }

      return !existingRecords || existingRecords.length === 0;

    } catch (error: any) {
      await logger.error('Unique constraint validation error', {
        tableName,
        constraint,
        error: error.message
      });
      return false;
    }
  }

  private async validateForeignKeyConstraint(
    data: any,
    constraint: {
      field: string;
      referencedTable: string;
      referencedField: string;
      message: string;
    }
  ): Promise<boolean> {
    const fieldValue = data[constraint.field];
    
    if (!fieldValue) {
      return true; // Null/undefined values are handled by schema validation
    }

    try {
      const { data: referencedRecord, error } = await supabase
        .from(constraint.referencedTable)
        .select(constraint.referencedField)
        .eq(constraint.referencedField, fieldValue)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw new Error(`Foreign key validation failed: ${error.message}`);
      }

      return !!referencedRecord;

    } catch (error: any) {
      await logger.error('Foreign key constraint validation error', {
        constraint,
        error: error.message
      });
      return false;
    }
  }

  private async validateBusinessRules(
    tableName: string,
    data: any,
    operation: string
  ): Promise<ValidationResult> {
    // Business-specific validation rules
    switch (tableName) {
      case 'appointments':
        return this.validateAppointmentRules(data, operation);
      
      case 'test_reports':
        return this.validateTestReportRules(data, operation);
      
      case 'invoices':
        return this.validateInvoiceRules(data, operation);
      
      case 'customers':
        return this.validateCustomerRules(data, operation);
      
      default:
        return { success: true };
    }
  }

  private async validateAppointmentRules(data: any, operation: string): Promise<ValidationResult> {
    // Check appointment date is in the future (for new appointments)
    if (operation === 'INSERT' && data.scheduled_date) {
      const appointmentDate = new Date(data.scheduled_date);
      const now = new Date();
      
      if (appointmentDate <= now) {
        return {
          success: false,
          error: 'Appointment must be scheduled for a future date',
          fieldErrors: {
            scheduled_date: 'Appointment date must be in the future'
          }
        };
      }
    }

    // Check for conflicting appointments
    if (data.technician_id && data.scheduled_date) {
      const { data: conflicts, error } = await supabase
        .from('appointments')
        .select('id, scheduled_date, estimated_duration')
        .eq('technician_id', data.technician_id)
        .gte('scheduled_date', new Date(data.scheduled_date).toISOString())
        .lte('scheduled_date', new Date(new Date(data.scheduled_date).getTime() + (data.estimated_duration || 120) * 60000).toISOString())
        .neq('status', 'cancelled');

      if (error) {
        throw new Error(`Appointment conflict check failed: ${error.message}`);
      }

      // Exclude current appointment for updates
      const filteredConflicts = operation === 'UPDATE' 
        ? conflicts?.filter(c => c.id !== data.id) 
        : conflicts;

      if (filteredConflicts && filteredConflicts.length > 0) {
        return {
          success: false,
          error: 'Appointment conflicts with existing appointment',
          fieldErrors: {
            scheduled_date: 'Time slot conflicts with existing appointment'
          }
        };
      }
    }

    return { success: true };
  }

  private async validateTestReportRules(data: any, operation: string): Promise<ValidationResult> {
    // Test report must have associated appointment
    if (data.appointment_id) {
      const { data: appointment, error } = await supabase
        .from('appointments')
        .select('id, status')
        .eq('id', data.appointment_id)
        .single();

      if (error || !appointment) {
        return {
          success: false,
          error: 'Associated appointment not found',
          fieldErrors: {
            appointment_id: 'Invalid appointment reference'
          }
        };
      }

      if (appointment.status !== 'in_progress' && appointment.status !== 'completed') {
        return {
          success: false,
          error: 'Test report can only be created for in-progress or completed appointments'
        };
      }
    }

    // Validate test results
    if (data.test_results) {
      const results = typeof data.test_results === 'string' 
        ? JSON.parse(data.test_results) 
        : data.test_results;

      if (!Array.isArray(results) || results.length === 0) {
        return {
          success: false,
          error: 'Test results must contain at least one test',
          fieldErrors: {
            test_results: 'At least one test result is required'
          }
        };
      }

      // Validate each test result
      for (const result of results) {
        if (!result.assembly_number || !result.status) {
          return {
            success: false,
            error: 'Each test result must have assembly number and status',
            fieldErrors: {
              test_results: 'Invalid test result format'
            }
          };
        }
      }
    }

    return { success: true };
  }

  private async validateInvoiceRules(data: any, operation: string): Promise<ValidationResult> {
    // Invoice amount validation
    if (data.amount !== undefined) {
      if (typeof data.amount !== 'number' || data.amount < 0) {
        return {
          success: false,
          error: 'Invoice amount must be a positive number',
          fieldErrors: {
            amount: 'Amount must be positive'
          }
        };
      }
    }

    // Due date validation
    if (data.due_date) {
      const dueDate = new Date(data.due_date);
      const issueDate = new Date(data.issue_date || data.created_at || Date.now());
      
      if (dueDate <= issueDate) {
        return {
          success: false,
          error: 'Due date must be after issue date',
          fieldErrors: {
            due_date: 'Due date must be in the future'
          }
        };
      }
    }

    return { success: true };
  }

  private async validateCustomerRules(data: any, operation: string): Promise<ValidationResult> {
    // Email uniqueness (additional business rule)
    if (data.email) {
      const { data: existingCustomer, error } = await supabase
        .from('customers')
        .select('id, email')
        .eq('email', data.email)
        .neq('id', data.id || '00000000-0000-0000-0000-000000000000')
        .single();

      if (!error && existingCustomer) {
        return {
          success: false,
          error: 'Email address is already in use',
          fieldErrors: {
            email: 'This email address is already registered'
          }
        };
      }
    }

    return { success: true };
  }

  private sanitizeLogData(data: any): any {
    const sanitized = { ...data };
    
    // Remove sensitive fields from logs
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'api_key'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });

    return sanitized;
  }
}

export const databaseValidator = new DatabaseValidator();

// Validation schemas for common tables
export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Valid email is required').max(255),
  phone: z.string().min(10, 'Valid phone number is required').max(20),
  address: z.string().min(1, 'Address is required').max(500),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(2, 'State is required').max(50),
  zip_code: z.string().min(5, 'Valid ZIP code is required').max(10),
  water_department: z.string().max(255).optional(),
  account_number: z.string().max(100).optional(),
  notes: z.string().max(1000).optional()
});

export const appointmentSchema = z.object({
  customer_id: z.string().uuid('Valid customer ID is required'),
  technician_id: z.string().uuid('Valid technician ID is required').optional(),
  scheduled_date: z.string().datetime('Valid date/time is required'),
  estimated_duration: z.number().min(30).max(480).default(120),
  service_type: z.enum(['testing', 'installation', 'repair', 'maintenance']),
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled']).default('scheduled'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  notes: z.string().max(1000).optional(),
  special_instructions: z.string().max(500).optional()
});

export const testReportSchema = z.object({
  appointment_id: z.string().uuid('Valid appointment ID is required'),
  technician_id: z.string().uuid('Valid technician ID is required'),
  test_date: z.string().datetime('Valid test date is required'),
  test_results: z.array(z.object({
    assembly_number: z.string().min(1, 'Assembly number is required'),
    serial_number: z.string().optional(),
    manufacturer: z.string().optional(),
    model: z.string().optional(),
    size: z.string().optional(),
    status: z.enum(['pass', 'fail', 'requires_repair']),
    pressure_reading: z.number().optional(),
    notes: z.string().max(500).optional()
  })).min(1, 'At least one test result is required'),
  overall_status: z.enum(['pass', 'fail', 'partial']),
  technician_signature: z.string().min(1, 'Technician signature is required'),
  observations: z.string().max(1000).optional(),
  recommendations: z.string().max(1000).optional()
});

// Register schemas
databaseValidator.registerSchema('customers', customerSchema);
databaseValidator.registerSchema('appointments', appointmentSchema);
databaseValidator.registerSchema('test_reports', testReportSchema);

// Register constraints
databaseValidator.registerTableConstraints({
  tableName: 'customers',
  uniqueConstraints: [
    {
      fields: ['email'],
      message: 'Email address must be unique'
    }
  ],
  foreignKeyConstraints: [],
  checkConstraints: [
    {
      field: 'email',
      condition: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: 'Email must be valid'
    }
  ]
});

databaseValidator.registerTableConstraints({
  tableName: 'appointments',
  uniqueConstraints: [],
  foreignKeyConstraints: [
    {
      field: 'customer_id',
      referencedTable: 'customers',
      referencedField: 'id',
      message: 'Customer must exist'
    },
    {
      field: 'technician_id',
      referencedTable: 'technicians',
      referencedField: 'id',
      message: 'Technician must exist'
    }
  ],
  checkConstraints: [
    {
      field: 'estimated_duration',
      condition: (value) => value >= 30 && value <= 480,
      message: 'Duration must be between 30 minutes and 8 hours'
    }
  ]
});

// Export validation helper functions
export const validateData = <T>(
  tableName: string,
  data: any,
  operation: 'INSERT' | 'UPDATE' | 'DELETE' = 'INSERT'
): Promise<ValidationResult<T>> => {
  return databaseValidator.validateAndSanitize<T>(tableName, data, operation);
};

export { ValidationError, BusinessLogicError } from '../error-handling/error-middleware';