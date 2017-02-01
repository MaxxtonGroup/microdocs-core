def projectFolder = 'microdocs-core-ts';
def semver = input message: 'Increase the patch, minor, major version', parameters: [choice(choices: "patch\nminor\nmajor", description: 'Increase the patch, minor, major version', name: 'SEM_VERSION')]
node {
    stage('Checkout'){
        deleteDir()
        echo "Checkout git"
        checkout([$class: 'GitSCM', branches: [[name: '*/development']], doGenerateSubmoduleConfigurations: false, submoduleCfg: [], userRemoteConfigs: [[url: 'git@github.com:MaxxtonGroup/microdocs.git']]])
        dir(projectFolder){
            sh 'ls -a'
            stash name: 'src'
        }
    }
    stage('Build'){
        dir(projectFolder){
            echo "Installing npm dependencies"
            unstash 'src'
            sh 'npm version ' + semver
            try{
                sh 'npm install'
            }catch(e){
                sh 'ls node_modules'
                throw e
            }
            stash name: 'build'
        }
    }

    stage('Test'){
        dir(projectFolder){
            echo "Test"
            unstash 'build'
            sh 'npm test'
        }
    }

    stage('PrePublish'){
        dir(projectFolder){
            echo "PrePublish"
            unstash 'build'
            sh 'npm run prepublish'
            dir('dist'){
                stash 'dist'
            }
        }
    }

    stage('Publish'){
        dir(projectFolder + '/dist'){
            echo "Publish"
            unstash 'dist'
            sh 'echo @maxxton:registry=https://npm.maxxton.com > .npmrc'
            sh 'npm publish'
        }
    }
}