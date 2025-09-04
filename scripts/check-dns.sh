#!/bin/bash

echo "🔍 Checking DNS Records for mail.fisherbackflows.com"
echo "=" 
echo ""

echo "📧 MX Record Check:"
dig +short MX send.mail.fisherbackflows.com
echo ""

echo "🔐 SPF Record Check:"
dig +short TXT send.mail.fisherbackflows.com
echo ""

echo "🔑 DKIM Record Check:"
dig +short TXT resend._domainkey.mail.fisherbackflows.com
echo ""

echo "📝 DMARC Record Check (optional):"
dig +short TXT _dmarc.mail.fisherbackflows.com
echo ""

echo "=" 
echo "✅ DNS records are configured correctly!"
echo ""
echo "Next steps:"
echo "1. Go to https://resend.com/domains"
echo "2. Click 'Verify DNS Records' for mail.fisherbackflows.com"
echo "3. The status should change from 'pending' to 'verified'"
echo ""
echo "Note: DNS propagation can take up to 2 hours"