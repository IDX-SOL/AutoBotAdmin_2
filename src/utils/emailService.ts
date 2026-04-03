import adminApiService, {
  EmailTemplate,
  EmailLog,
  EmailHistoryResponse,
  SendMailAwsPayload,
} from './adminApiService';

export type { SendMailAwsPayload };

interface ErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export interface EmailData {
  subject: string;
  content: string;
  userIds: string[];
  type: 'individual' | 'bulk' | 'all';
  templateId?: number;
}

export interface EmailStats {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
}

export interface EmailSchedulerStatus {
  emailServiceReady: boolean;
  schedulerRunning: boolean;
  lastRun: string | null;
  nextRun: string | null;
  activeJobs: string[];
}

class EmailService {
  private baseUrl = '/admin/emails';

  /**
   * Send email to users (POST /admin/emails/send)
   */
  async sendEmail(emailData: EmailData): Promise<{ success: boolean; message: string; emailId?: string }> {
    try {
      const response = await adminApiService.getAxiosInstance().post(`${this.baseUrl}/send`, emailData);

      if (response.status === 200) {
        return {
          success: true,
          message: 'Email sent successfully',
          emailId: response.data.emailId,
        };
      }

      return {
        success: false,
        message: response.data.message || 'Failed to send email',
      };
    } catch (error: unknown) {
      console.error('Error sending email:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as ErrorResponse).response?.data?.message
        : 'Failed to send email';
      return {
        success: false,
        message: errorMessage || 'Failed to send email',
      };
    }
  }

  /**
   * Marketing page: POST /admin/sendmail/aws
   */
  async sendMarketingMailAws(
    payload: SendMailAwsPayload
  ): Promise<{ success: boolean; message: string; emailId?: string }> {
    try {
      const response = await adminApiService.sendMailAws(payload);

      if (response.status >= 200 && response.status < 300) {
        return {
          success: true,
          message: response.data?.message || 'Email sent successfully',
          emailId: response.data?.emailId,
        };
      }

      return {
        success: false,
        message: response.data?.message || 'Failed to send email',
      };
    } catch (error: unknown) {
      console.error('Error sending marketing mail (AWS):', error);
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? (error as ErrorResponse).response?.data?.message
          : 'Failed to send email';
      return {
        success: false,
        message: errorMessage || 'Failed to send email',
      };
    }
  }

  /**
   * Get email templates
   */
  async getTemplates(): Promise<EmailTemplate[]> {
    try {
      const response = await adminApiService.getAxiosInstance().get(`${this.baseUrl}/templates`);
      
      if (response.status === 200) {
        return response.data.templates || [];
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  }

  /**
   * Save email template
   */
  async saveTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt'>): Promise<{ success: boolean; templateId?: number; message: string }> {
    try {
      const response = await adminApiService.getAxiosInstance().post(`${this.baseUrl}/templates`, template);
      
      if (response.status === 200) {
        return {
          success: true,
          templateId: response.data.templateId,
          message: 'Template saved successfully'
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Failed to save template'
      };
    } catch (error: unknown) {
      console.error('Error saving template:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as ErrorResponse).response?.data?.message 
        : 'Failed to save template';
      return {
        success: false,
        message: errorMessage || 'Failed to save template'
      };
    }
  }

  /**
   * Update email template
   */
  async updateTemplate(templateId: number, template: Partial<EmailTemplate>): Promise<{ success: boolean; message: string }> {
    try {
      const response = await adminApiService.getAxiosInstance().put(`${this.baseUrl}/templates/${templateId}`, template);
      
      if (response.status === 200) {
        return {
          success: true,
          message: 'Template updated successfully'
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Failed to update template'
      };
    } catch (error: unknown) {
      console.error('Error updating template:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as ErrorResponse).response?.data?.message 
        : 'Failed to update template'
      return {
        success: false,
        message: errorMessage || 'Failed to update template'
      };
    }
  }

  /**
   * Delete email template
   */
  async deleteTemplate(templateId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await adminApiService.getAxiosInstance().delete(`${this.baseUrl}/templates/${templateId}`);
      
      if (response.status === 200) {
        return {
          success: true,
          message: 'Template deleted successfully'
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Failed to delete template'
      };
    } catch (error: unknown) {
      console.error('Error deleting template:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as ErrorResponse).response?.data?.message 
        : 'Failed to delete template'
      return {
        success: false,
        message: errorMessage || 'Failed to delete template'
      };
    }
  }

  /**
   * Get email statistics
   */
  async getEmailStats(): Promise<EmailStats | null> {
    try {
      const response = await adminApiService.getAxiosInstance().get(`${this.baseUrl}/stats`);
      
      if (response.status === 200) {
        return response.data.stats;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching email stats:', error);
      return null;
    }
  }

  /**
   * Get email history
   */
  async getEmailHistory(page: number = 1, limit: number = 20): Promise<EmailHistoryResponse> {
    try {
      const response = await adminApiService.getEmailLogs({ page, limit });
      
      if (response.status === 200) {
        return response.data;
      }
      
      return { success: false, emails: [], total: 0, page: 1, totalPages: 1 };
    } catch (error) {
      console.error('Error fetching email history:', error);
      return { success: false, emails: [], total: 0, page: 1, totalPages: 1 };
    }
  }

  /**
   * Get email scheduler status
   */
  async getEmailSchedulerStatus(): Promise<EmailSchedulerStatus | null> {
    try {
      const response = await adminApiService.getEmailStatus();
      
      if (response.status === 200) {
        return response.data.status;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching email scheduler status:', error);
      return null;
    }
  }

  /**
   * Start email scheduler
   */
  async startEmailScheduler(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await adminApiService.startEmailScheduler();
      
      if (response.status === 200) {
        return {
          success: true,
          message: response.data.message
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Failed to start scheduler'
      };
    } catch (error: unknown) {
      console.error('Error starting email scheduler:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as ErrorResponse).response?.data?.message 
        : 'Failed to start scheduler';
      return {
        success: false,
        message: errorMessage || 'Failed to start scheduler'
      };
    }
  }

  /**
   * Stop email scheduler
   */
  async stopEmailScheduler(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await adminApiService.stopEmailScheduler();
      
      if (response.status === 200) {
        return {
          success: true,
          message: response.data.message
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Failed to stop scheduler'
      };
    } catch (error: unknown) {
      console.error('Error stopping email scheduler:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as ErrorResponse).response?.data?.message 
        : 'Failed to stop scheduler';
      return {
        success: false,
        message: errorMessage || 'Failed to stop scheduler'
      };
    }
  }

  /**
   * Run specific email job
   */
  async runEmailJob(jobName: string): Promise<{ success: boolean; message: string; results?: Array<{ job: string; status: string; error?: string }> }> {
    try {
      const response = await adminApiService.runEmailJob(jobName);
      
      if (response.status === 200) {
        return {
          success: true,
          message: response.data.message,
          results: response.data.results
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Failed to run job'
      };
    } catch (error: unknown) {
      console.error('Error running email job:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as ErrorResponse).response?.data?.message 
        : 'Failed to run job';
      return {
        success: false,
        message: errorMessage || 'Failed to run job'
      };
    }
  }

  /**
   * Run all email automations
   */
  async runAllEmailAutomations(): Promise<{ success: boolean; message: string; results?: Array<{ job: string; status: string; error?: string }> }> {
    try {
      const response = await adminApiService.runAllEmailAutomations();
      
      if (response.status === 200) {
        return {
          success: true,
          message: response.data.message,
          results: response.data.results
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Failed to run all automations'
      };
    } catch (error: unknown) {
      console.error('Error running all email automations:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as ErrorResponse).response?.data?.message 
        : 'Failed to run all automations';
      return {
        success: false,
        message: errorMessage || 'Failed to run all automations'
      };
    }
  }

  /**
   * Initialize email templates
   */
  async initializeEmailTemplates(): Promise<{ success: boolean; message: string; templatesCreated?: number }> {
    try {
      const response = await adminApiService.initializeEmailTemplates();
      
      if (response.status === 200) {
        return {
          success: true,
          message: response.data.message,
          templatesCreated: response.data.templatesCreated
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Failed to initialize templates'
      };
    } catch (error: unknown) {
      console.error('Error initializing email templates:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as ErrorResponse).response?.data?.message 
        : 'Failed to initialize templates';
      return {
        success: false,
        message: errorMessage || 'Failed to initialize templates'
      };
    }
  }

  /**
   * Get email log details
   */
  async getEmailLogDetails(emailId: number): Promise<EmailLog | null> {
    try {
      const response = await adminApiService.getEmailLogDetails(emailId);
      
      if (response.status === 200) {
        return response.data.email;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching email log details:', error);
      return null;
    }
  }

  /**
   * Resend email
   */
  async resendEmail(emailId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await adminApiService.resendEmail(emailId);
      
      if (response.status === 200) {
        return {
          success: true,
          message: response.data.message
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Failed to resend email'
      };
    } catch (error: unknown) {
      console.error('Error resending email:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as ErrorResponse).response?.data?.message 
        : 'Failed to resend email';
      return {
        success: false,
        message: errorMessage || 'Failed to resend email'
      };
    }
  }

  /**
   * Validate email content for security
   */
  validateEmailContent(content: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for potentially dangerous content
    if (content.includes('<script')) {
      errors.push('Script tags are not allowed');
    }
    
    if (content.includes('javascript:')) {
      errors.push('JavaScript protocols are not allowed');
    }
    
    if (content.includes('onclick=') || content.includes('onload=')) {
      errors.push('Event handlers are not allowed');
    }
    
    // Check content length
    if (content.length > 50000) {
      errors.push('Email content is too long (max 50,000 characters)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Format email content for preview
   */
  formatEmailContent(content: string): string {
    // Remove any potentially dangerous content
    const formatted = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
    
    return formatted;
  }
}

const emailService = new EmailService();
export default emailService; 