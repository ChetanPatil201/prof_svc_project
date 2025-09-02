# AI-Assisted Architecture Setup Guide

## Azure OpenAI Configuration

The AI-assisted graph builder requires Azure OpenAI to be configured. Follow these steps to set it up:

### 1. Create Azure OpenAI Resource

1. Go to the [Azure Portal](https://portal.azure.com)
2. Create a new "Azure OpenAI" resource
3. Choose your subscription, resource group, and region
4. Select a pricing tier (S0 is sufficient for testing)
5. Wait for deployment to complete

### 2. Deploy a Model

1. In your Azure OpenAI resource, go to "Model deployments"
2. Click "Manage deployments"
3. Create a new deployment:
   - Model: `gpt-4o` (recommended) or `gpt-4`
   - Deployment name: `gpt-4o` (or your preferred name)

### 3. Get Your Credentials

1. In your Azure OpenAI resource, go to "Keys and Endpoint"
2. Copy the "Endpoint" URL
3. Copy one of the "Keys"

### 4. Configure Environment Variables

Create a `.env.local` file in your project root with:

```bash
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_KEY=your-api-key-here
AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

### 5. Restart Your Development Server

```bash
npm run dev
```

## Usage

Once configured, you can use the AI suggestion feature:

1. Navigate to the Azure Architecture Diagram page
2. Click the "AI Suggest" button
3. The AI will analyze your assessment data and generate a CAF-compliant architecture
4. Review the AI-generated assumptions displayed below the diagram

## Fallback Behavior

If Azure OpenAI is not configured:
- The AI Suggest button will still work
- It will use a default hub-spoke architecture pattern
- A helpful error message will be displayed explaining the missing configuration

## Troubleshooting

### "Azure OpenAI not configured" Error
- Check that your `.env.local` file exists and has the correct variables
- Ensure the endpoint URL ends with a forward slash
- Verify your API key is correct
- Restart your development server after adding environment variables

### "Invalid API Key" Error
- Regenerate your API key in the Azure portal
- Update your `.env.local` file with the new key

### "Model not found" Error
- Ensure you have deployed the `gpt-4o` model in your Azure OpenAI resource
- Check that the deployment name matches your `AZURE_OPENAI_DEPLOYMENT` variable

## Security Notes

- Environment variables are only available server-side for security
- API keys are never exposed to the client
- All AI requests go through a secure API route
