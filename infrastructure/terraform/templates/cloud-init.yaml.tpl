#cloud-config
package_update: true
packages:
  - curl
  - wget
  - ufw
  - fail2ban

users:
  - name: agent
    shell: /bin/bash
    sudo: ALL=(ALL) NOPASSWD:ALL
    ssh-authorized-keys:
      - ${ssh_public_key}

write_files:
  - path: /etc/mutx/agent.env
    content: |
      CUSTOMER_ID=${customer_id}
      AGENT_PORT=${agent_port}
      AGENT_VERSION=${agent_version}
      TELEMETRY_ENABLED=${telemetry_enabled}
    owner: "root:root"
    permissions: "0600"

  - path: /etc/ufw/user.rules
    content: |
      *filter
      :INPUT ACCEPT [0:0]
      :FORWARD ACCEPT [0:0]
      :OUTPUT ACCEPT [0:0]
      -A INPUT -i lo -j ACCEPT
      -A INPUT -m state --state RELATED,ESTABLISHED -j ACCEPT
      -A INPUT -p tcp --dport ${agent_port} -j ACCEPT
      -A INPUT -j DROP
      COMMIT

runcmd:
  - systemctl enable ufw
  - ufw --force enable
  - ufw allow ${agent_port}/tcp
  - ufw allow 22/tcp
  - systemctl start fail2ban

output:
  all: ">> /var/log/cloud-init.log"
