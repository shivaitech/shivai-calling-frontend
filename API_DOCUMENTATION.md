# Widget Customization API Documentation

## Overview
This document outlines the API endpoints needed to support real-time widget customization and configuration management for the AgentWidgetCustomization component.

## Required Endpoints

### 1. Get Widget Configuration
**Endpoint:** `GET /api/agents/{agentId}/widget-config`

**Description:** Retrieve the current widget configuration for a specific agent.

**Response:**
```json
{
  "agentId": "string",
  "config": {
    "theme": {
      "primaryColor": "#3b82f6",
      "secondaryColor": "#ffffff",
      "accentColor": "#2563eb",
      "borderRadius": "16px",
      "buttonStyle": "floating",
      "widgetStyle": "modern"
    },
    "ui": {
      "position": "bottom-right",
      "buttonSize": "medium",
      "chatHeight": "500px",
      "chatWidth": "380px",
      "autoOpen": false,
      "minimizeButton": true,
      "draggable": true
    },
    "content": {
      "welcomeMessage": "Hi! I'm AgentName. How can I help you today?",
      "companyName": "ShivAI",
      "companyDescription": "AI-Powered Support",
      "companyLogo": "base64_or_url",
      "placeholderText": "Type your message...",
      "offlineMessage": "We're currently offline. Please leave a message."
    },
    "features": {
      "voiceEnabled": true,
      "soundEffects": true,
      "showBranding": true,
      "messageHistory": true,
      "typingIndicator": true,
      "fileUpload": false
    },
    "customCSS": "/* Custom CSS */"
  },
  "updatedAt": "2024-01-01T00:00:00Z",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### 2. Update Widget Configuration
**Endpoint:** `PUT /api/agents/{agentId}/widget-config`

**Description:** Save/update the widget configuration for a specific agent.

**Request Body:**
```json
{
  "agentId": "string",
  "config": {
    // Same structure as GET response
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Widget configuration updated successfully",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### 3. Update Widget.js (Real-time Customization)
**Endpoint:** `POST /api/widget/update`

**Description:** Update the widget.js file with customized configuration.

**Request Body:**
```json
{
  "agentId": "string",
  "widgetCode": "string", // Generated widget.js code
  "config": {
    // Widget configuration object
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Widget.js updated successfully",
  "cdnUrl": "https://cdn.callshivai.com/widget-{agentId}.js"
}
```

## Implementation Notes

### Database Schema
Create a table to store widget configurations:

```sql
CREATE TABLE widget_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id VARCHAR(255) NOT NULL UNIQUE,
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_widget_configurations_agent_id ON widget_configurations(agent_id);
```

### Widget.js Customization Process

1. **Base Template**: Maintain a base widget.js template file
2. **Variable Injection**: Replace placeholder variables with actual configuration
3. **CSS Generation**: Generate dynamic CSS from theme configuration
4. **CDN Upload**: Upload customized widget.js to CDN with agent-specific filename
5. **Cache Management**: Implement cache invalidation when configuration changes

### Security Considerations

1. **Authentication**: Ensure proper JWT/session validation
2. **Rate Limiting**: Implement rate limiting for configuration updates
3. **Input Validation**: Validate all configuration parameters
4. **XSS Prevention**: Sanitize custom CSS and content fields
5. **Agent Ownership**: Verify user owns the agent being configured

### Example Widget.js Customization

```javascript
// Base widget.js template with placeholders
const WIDGET_CONFIG = {
  agentId: '{{AGENT_ID}}',
  theme: {
    primaryColor: '{{THEME_PRIMARY_COLOR}}',
    accentColor: '{{THEME_ACCENT_COLOR}}',
    borderRadius: '{{THEME_BORDER_RADIUS}}'
  },
  ui: {
    position: '{{UI_POSITION}}',
    autoOpen: {{UI_AUTO_OPEN}},
    draggable: {{UI_DRAGGABLE}}
  },
  features: {
    voiceEnabled: {{FEATURES_VOICE_ENABLED}},
    soundEffects: {{FEATURES_SOUND_EFFECTS}}
  }
};

// Custom CSS injection
const customCSS = `
{{CUSTOM_CSS}}

.shivai-trigger {
  background: {{THEME_PRIMARY_COLOR}} !important;
  border-radius: {{THEME_BORDER_RADIUS}} !important;
}
`;
```

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": "error_code",
  "message": "Human readable error message",
  "details": {
    "field": "specific field that caused error",
    "value": "invalid value"
  }
}
```

### Common Error Codes
- `AGENT_NOT_FOUND`: Agent ID doesn't exist
- `INVALID_CONFIG`: Configuration validation failed
- `UNAUTHORIZED`: User doesn't own the agent
- `RATE_LIMITED`: Too many requests
- `WIDGET_UPDATE_FAILED`: Failed to update widget.js file

## Testing

1. **Unit Tests**: Test configuration validation and transformation
2. **Integration Tests**: Test API endpoints with various configurations
3. **Widget Tests**: Test generated widget.js in different environments
4. **Performance Tests**: Test with high configuration update frequency

## Monitoring

1. **Configuration Changes**: Log all configuration updates
2. **Widget Performance**: Monitor widget load times and errors
3. **API Usage**: Track configuration update frequency per agent
4. **CDN Performance**: Monitor widget.js delivery performance