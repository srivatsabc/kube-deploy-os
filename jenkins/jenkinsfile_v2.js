node {
    stage "checkout"
    //git([url:"https://github.com/luxengine/math.git"])
    checkout([$class: 'GitSCM',
        branches: [[name: '*/master']],
        doGenerateSubmoduleConfigurations: false,
        extensions: [[$class: 'RelativeTargetDirectory',
            relativeTargetDir: 'route-locator-0.0.2']],
        submoduleCfg: [],
        userRemoteConfigs: [[url: 'https://github.com/srivatsabc/system-api-repo.git', credentialsId:'srivatsabc_git_login']]])

    stage "build"
    echo "Building from pipeline"
}
