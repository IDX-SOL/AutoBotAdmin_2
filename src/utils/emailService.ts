import adminApiService from './adminApiService';

export interface EmailData {
  subject: string;
  content: string;
  userIds: string[];
  type: 'individual' | 'bulk' | 'all';
  templateId?: number;
}

export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EmailStats {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
}

class EmailService {
  private baseUrl = '/admin/emails';

  /**
   * Send email to users
   */
  async sendEmail(emailData: EmailData): Promise<{ success: boolean; message: string; emailId?: string }> {
    try {
      const response = await adminApiService.getAxiosInstance().post(`${this.baseUrl}/send`, emailData);
      
      if (response.status === 200) {
        return {
          success: true,
          message: 'Email sent successfully',
          emailId: response.data.emailId
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Failed to send email'
      };
    } catch (error: any) {
      console.error('Error sending email:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send email'
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
    } catch (error: any) {
      console.error('Error saving template:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to save template'
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
    } catch (error: any) {
      console.error('Error updating template:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update template'
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
    } catch (error: any) {
      console.error('Error deleting template:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete template'
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
  async getEmailHistory(page: number = 1, limit: number = 20): Promise<{ emails: any[]; total: number; page: number; totalPages: number }> {
    try {
      const response = await adminApiService.getAxiosInstance().get(`${this.baseUrl}/history`, {
        params: { page, limit }
      });
      
      if (response.status === 200) {
        return response.data;
      }
      
      return { emails: [], total: 0, page: 1, totalPages: 1 };
    } catch (error) {
      console.error('Error fetching email history:', error);
      return { emails: [], total: 0, page: 1, totalPages: 1 };
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
    let formatted = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
    
    return formatted;
  }
}

export default new EmailService(); 