def projectName = 'microdocs-core';
def newVersion = '';
def semver = input message: 'Increase the patch, minor, major version', parameters: [choice(choices: "patch\nminor\nmajor", description: 'Increase the patch, minor, major version', name: 'SEM_VERSION')]
node {
    stage('Checkout'){
        deleteDir()
        echo "Checkout git"
        checkout([$class: 'GitSCM', branches: [[name: '*/master']], doGenerateSubmoduleConfigurations: false, submoduleCfg: [], userRemoteConfigs: [[url: 'git@github.com:MaxxtonGroup/microdocs-core.git']]])
        stash name: 'src'
    }
    stage('Build'){
        echo "Installing npm dependencies"
        unstash 'src'
        newVersion = sh(returnStdout: true, script: 'npm version ').trim()
        sh 'npm install'
        stash name: 'build'
    }

    stage('Test'){
        echo "Test"
        unstash 'build'
        sh 'npm test'
    }

    stage('PrePublish'){
        dir('microdocs-core-ts'){
            echo "PrePublish"
            unstash 'build'
            sh 'npm run prepublish'
            dir('dist'){
                stash 'dist'
            }
        }
    }

    stage('Git Tag'){
        sh 'git add package.json'
        sh 'git commit -a -m "release ' + projectName + ' ' + newVersion + '"'
        sh 'git tag ' + projectName + '_' + newVersion
        sh 'git push'
        sh 'git push origin ' + projectName + '_' + newVersion
    }

    stage('Publish'){
        dir('microdocs-core-ts/dist'){
            echo "Publish"
            unstash 'dist'
            sh 'echo @maxxton:registry=https://npm.maxxton.com > .npmrc'
            sh 'npm publish'
        }
    }
}