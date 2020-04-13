from srivatsabc/jenkins:os-v0.0.4

RUN apt-get install -y --no-install-recommends \
    xvfb \
    xauth && \
	apt-get autoremove -y && \
	apt-get clean

# Install IBM ACE v 11.0.0.6 Developer edition
RUN mkdir /opt/ibm && \
	export TMPDIR=/tmp && \
  curl -u k8s-admin:root ftp://192.168.1.63/Downloads/IBM_ACE/11.0.0.6-ACE-LINUX64-DEVELOP.tar.gz \
  | tar zx --directory /opt/ibm && \
  /opt/ibm/ace-11.0.0.6/ace make registry global accept license silently

# Configure group user id
USER root
RUN usermod -a -G mqbrkrs jenkins