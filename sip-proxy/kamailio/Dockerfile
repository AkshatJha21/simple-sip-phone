# Kamailio Dockerfile
# 
# This builds a Kamailio image with the modules needed for:
# - SIP proxying
# - WebSocket support (for browser softphones)
# - HTTP client (to query Node.js router API)

FROM kamailio/kamailio:5.7.2-bullseye

# Copy our custom configuration
COPY kamailio.cfg /etc/kamailio/kamailio.cfg

# Expose ports
# 5060 - SIP UDP/TCP
# 8080 - SIP WebSocket
EXPOSE 5060/udp 5060/tcp 8080/tcp

# Run Kamailio in foreground with debug logging
CMD ["kamailio", "-DD", "-E", "-m", "128"]
