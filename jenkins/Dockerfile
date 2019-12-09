from jenkins/jenkins:2.60.3

# Update jenkins
USER root
COPY jenkins.war /usr/share/jenkins
RUN chown jenkins:jenkins /usr/share/jenkins/jenkins.war

# Distributed Builds plugins
RUN /usr/local/bin/install-plugins.sh ssh-slaves

# install Notifications and Publishing plugins
RUN /usr/local/bin/install-plugins.sh email-ext
RUN /usr/local/bin/install-plugins.sh mailer
RUN /usr/local/bin/install-plugins.sh slack

# Artifacts
RUN /usr/local/bin/install-plugins.sh htmlpublisher

# UI
RUN /usr/local/bin/install-plugins.sh greenballs
RUN /usr/local/bin/install-plugins.sh simple-theme-plugin

# Scaling
RUN /usr/local/bin/install-plugins.sh kubernetes

# Install Docker
USER root
RUN apt-get update && \
apt-get -y install apt-transport-https \
     ca-certificates \
     curl \
     gnupg2 \
     software-properties-common && \
curl -fsSL https://download.docker.com/linux/$(. /etc/os-release; echo "$ID")/gpg > /tmp/dkey; apt-key add /tmp/dkey && \
add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/$(. /etc/os-release; echo "$ID") \
   $(lsb_release -cs) \
   stable" && \
apt-get update && \
apt-get -y install docker-ce

# Configure group user id
USER root
RUN usermod -a -G docker jenkins && usermod -a -G root jenkins && groupmod -g 1001 docker && usermod -a -G docker root && usermod -a -G root jenkins && usermod -a -G jenkins root

# Install kubectl (work-around)
USER root
RUN curl -o /usr/bin/kubectl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl && chmod 755 /usr/bin/kubectl

# Install OpenShift Client (OpenShift)
RUN curl -u k8s-admin:root ftp://192.168.1.63/Downloads/okd.tar.gz \
	| tar zx --directory /usr/bin && chmod 755 /usr/bin/oc

# Install maven
USER root
RUN apt-get update && apt-get install -y maven

# Set root id (instead of jenkins) for the container to solve /var/run/docker.sock permission issue with OpenShift
USER root
