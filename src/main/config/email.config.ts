export const emailConfig = {
  mailgun: {
    apiKey: process.env.MAILGUN_API_KEY || '',
    domain: process.env.MAILGUN_DOMAIN || '',
    apiUrl: process.env.MAILGUN_API_URL || 'https://api.mailgun.net/v3',
    from: {
      email: process.env.MAILGUN_FROM_EMAIL || 'noreply@example.com',
      name: process.env.MAILGUN_FROM_NAME || 'Personal Financial Management',
    },
  },
};

export const validateEmailConfig = (): void => {
  const { apiKey, domain } = emailConfig.mailgun;

  console.log('apiKey', apiKey);
  console.log('domain', domain);

  if (!apiKey) {
    throw new Error('MAILGUN_API_KEY is not defined in environment variables');
  }

  if (!domain) {
    throw new Error('MAILGUN_DOMAIN is not defined in environment variables');
  }
};
