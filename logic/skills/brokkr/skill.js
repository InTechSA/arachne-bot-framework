/*
  SKILL : brokkr
  AUTHOR : Anonymous
  DATE : 28/05/2018
*/

/*
  You should not modify this part unless you know what you're doing.
*/

// Defining the skill
// Commands the skill can execute.
/* <SKILL COMMANDS> */
let commands = {
    'brokkr': {
      cmd: "brokkr",
      execute: brokkr
    }
  };
  /* </SKILL COMMANDS> */
  
  // intents the skill understands.
  /* <SKILL INTENTS> */
  let intents = {
    'brokkr-list-apps': {
      slug: "list-apps",
      handle: handleListApps,
      expected_entities: ["client"]
    },
    'brokkr-app-logs': {
      slug: "app_logs",
      handle: handleAppLogs,
      expected_entities: ["client", "application"]
    },
    'brokkr-app-config': {
      slug: "app-get-config",
      handle: handleAppConfig,
      expected_entities: ["client", "application"]
    },
    'brokkr-get-projects': {
      slug: "brokkr-get-projects",
      handle: handleListProjects,
      expected_entities: ["client"]
    },
    'brokkr-get-mr': {
      slug: "brokkr-get-mr",
      handle: handleListMR,
      expected_entities: ["client"]
    },
    'brokkr-accept-mr': {
      slug: "brokkr-accept-mr",
      handle: handleAcceptMR,
      expected_entities: ["client", "request"]
    }
  };
  /* </SKILL INTENTS> */
  
  // Conversation handlers of the skill.
  /* <SKILL INTERACTIONS> */
  let interactions = {
      'accept-mr-handler': {
          name: "accept-mr-handler",
          interact: confirmMR
      },
      'create-mr-handler': {
          name: "create-mr-handler",
          interact: concludeMR
      }
  };
  /* </SKILL INTERACTIONS> */
  
  // dependencies of the skill.
  /* <SKILL DEPENDENCIES> */
  let dependencies = ["axios"];
  /* </SKILL DEPENDENCIES> */
  
  // Exposing the skill definition.
  exports.commands = commands;
  exports.intents = intents;
  exports.dependencies = dependencies;
  exports.interactions = interactions;
  
  /*
    Skill logic begins here.
    You must implements the functions listed as "execute" and "handle" handler, or your skill will not load.
  */
  /* <SKILL LOGIC> */
  const axios = require('axios');
  const { app_token, brokkr_url } = require('./secret');
  const overseer = require('../../overseer');
  
  /**
    Handler for command list-apps (!brokkr apps).
  
    Params :
    --------
      phrase: String
  */
  function listApps({ phrase, data }) {
    return new Promise((resolve, reject) => {
      /*
        >>> YOUR CODE HERE <<<
        resolve the handler with a formatted message object.
      */
      const headers = {};
      if (data.userName) {
          headers['User-Proxy'] = data.userName;
      }
      axios({
          method: "GET",
          url: `${brokkr_url}/clients/${phrase}/apps`,
          headers,
          data: { app_token },
          timeout: 8000
      }).then(res => {
          let text = "";
          res.data.content.forEach(app => {
             text += `- *${app.name}*: _${app.status}_\n`
          });
          return resolve({
              message: {
                  title: `Applications sur ${phrase}`,
                  private: true,
                  text
              }
          });
      }).catch(err => {
          return resolve({
              message: {
                  title: 'Could not get applications list.',
                  text: 'The Brokkr service is not accessible.'
              }
          });
      });
    });
  }
  
  function appLogs({ phrase, data }) {
    return new Promise((resolve, reject) => {
      /*
        >>> YOUR CODE HERE <<<
        resolve the handler with a formatted message object.
      */
      const [client, app] = phrase.split(" ");
      const headers = {};
      if (data.userName) {
          headers['User-Proxy'] = data.userName;
      }
      axios({
          method: "GET",
          url: `${brokkr_url}/clients/${client}/apps/${app}/logs`,
          headers,
          data: { app_token },
          timeout: 5000
      }).then(res => {
          let text = res.data.content;
          return resolve({
              message: {
                  title: `Applications sur ${phrase}`,
                  private: true,
                  text: text.substring(text.length - 4000, text.length).split("\n").map(line => " " + line).join("\n").replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '') // eslint-disable-line no-control-regex
              }
          });
      }).catch(err => {
          if (err.response && err.response.status == 404) {
              return resolve({
                  message: {
                      title: 'Application not found.',
                      text: err.response.data.message
                  }
              });    
          }
          return resolve({
              message: {
                  title: 'Could not get applications logs.',
                  text: 'The Brokkr service is not accessible.'
              }
          });
      });
    });
  }
  
  function appConfig({ phrase, data }) {
    return new Promise((resolve, reject) => {
      /*
        >>> YOUR CODE HERE <<<
        resolve the handler with a formatted message object.
      */
      const [client, app] = phrase.split(" ");
      const headers = {};
      if (data.userName) {
          headers['User-Proxy'] = data.userName;
      }
      axios({
          method: "GET",
          url: `${brokkr_url}/clients/${client}/apps/${app}/configuration`,
          headers,
          data: { app_token },
          timeout: 5000
      }).then(res => {
          let text = res.data.content.map(el => `*${el[0]}* ----> ${el[1]}`);
          return resolve({
              message: {
                  title: `Configuration de ${app} sur ${client}`,
                  private: true,
                  text: text.join("\n")
              }
          });
      }).catch(err => {
          if (err.response && err.response.status == 404) {
              return resolve({
                  message: {
                      title: 'Application not found.',
                      text: err.response.data.message
                  }
              });    
          }
          return resolve({
              message: {
                  title: 'Could not get application configuration.',
                  text: 'The Brokkr service is not accessible.'
              }
          });
      });
    });
  }
  
  function appConfigSet({ phrase, data }) {
    return new Promise((resolve, reject) => {
      /*
        >>> YOUR CODE HERE <<<
        resolve the handler with a formatted message object.
      */
  
      const [client, app, ...configs] = phrase.split(" ");
  
      const configObject = {};
      configs.map(config => config.split("=")).forEach(config => configObject[config[0]] = config[1]);
      
      const headers = {};
      if (data.userName) {
          headers['User-Proxy'] = data.userName;
      }
      
      axios({
          method: "POST",
          url: `${brokkr_url}/clients/${client}/apps/${app}/configuration`,
          headers,
          data: { app_token, configuration: configObject },
          timeout: 200000
      }).then(res => {
          return resolve({
              message: {
                  title: `Configuration de ${app} sur ${client} mise à jour.`,
                  private: true
              }
          });
      }).catch(err => {
          if (err.response && err.response.status == 404) {
              return resolve({
                  message: {
                      title: 'Application not found.',
                      text: err.response.data.message
                  }
              });    
          }
          if (err.response && err.response.status == 400) {
              return resolve({
                  message: {
                      title: 'Invalid command.',
                      text: err.response.data.message
                  }
              });    
          }
          return resolve({
              message: {
                  title: 'Could not set application configuration.',
                  text: 'The Brokkr service is not accessible.'
              }
          });
      });
    });
  }
  
  function listProjects({ phrase, data }) {
      return new Promise((resolve, reject) => {
      /*
        >>> YOUR CODE HERE <<<
        resolve the handler with a formatted message object.
      */
      const headers = {};
      if (data.userName) {
          headers['User-Proxy'] = data.userName;
      }
      axios({
          method: "GET",
          url: `${brokkr_url}/clients/${phrase}/projects`,
          headers,
          data: { app_token },
          timeout: 5000
      }).then(res => {
          let text = "";
          res.data.content.forEach(project => {
             text += `• *<${project.web_url}|${project.name_with_namespace}>*: \n`
          });
          return resolve({
              message: {
                  title: `Vos projets sur ${phrase}`,
                  private: true,
                  text
              }
          });
      }).catch(err => {
          if (err.response.status == 401) {
            return resolve({
              message: {
                  title: "Brokkr can't access your data.",
                  text: `Visit <${brokkr_url}/addkey/${phrase}> to authorize the application.`
              }
            });    
          }
          return resolve({
              message: {
                  title: 'Could not get applications list.',
                  text: 'The Brokkr service is not accessible.'
              }
          });
      });
    });
  }
  
  function listMR({ phrase, data }) {
      return new Promise((resolve, reject) => {
      /*
        >>> YOUR CODE HERE <<<
        resolve the handler with a formatted message object.
      */
      const headers = {};
      if (data.userName) {
          headers['User-Proxy'] = data.userName;
      }
      axios({
          method: "GET",
          url: `${brokkr_url}/clients/${phrase}/merge_requests`,
          headers,
          data: { app_token },
          timeout: 10000
      }).then(res => {
          if (res.data.content.length === 0) {
              return resolve({
                  message: {
                      text: "Nope. You have no currently open merge request on " + phrase + "!"   
                  }
              });
          }
          let attachments = res.data.content.map(mr => {
              return {
                  title: `${mr.project.id}-${mr.iid} ► ${mr.title}: from ${mr.source_branch} in ${mr.target_branch} of ${mr.project.id}.`,
                  text: `It was created by ${mr.author.username} on ${new Date(mr.created_at).toLocaleString()}, and assigned to ${mr.assignee.username}.`
                      + '\n> *Labels:*'
                      + `\n${mr.labels.join(", ")}\n`
                      + '\n> *Description:*'
                      + `\n${mr.description}\n`
                      + mr.can_be_merged ? `\nAccept with \`!brokkr mr accept ${phrase} ${mr.project.id}-${mr.iid}\`` : "Can not be merged automatically, click the MR title to go to gitlab.",
                  color: mr.can_be_merged ? "#006600" : "#FF9900",
                  title_link: mr.url,
                  
              }
          });
          return resolve({
              message: {
                  title: `Vos merge requests ouvertes sur ${phrase}`,
                  private: true,
                  attachments
              }
          });
      }).catch(err => {
          if (err.response.status == 401) {
            return resolve({
              message: {
                  title: "Brokkr can't access your data.",
                  text: `Visit ${brokkr_url}/addkey/${phrase} to authorize the application.`
              }
            });    
          }
          return resolve({
              message: {
                  title: 'Could not get list of merge requests.',
                  text: 'The Brokkr service is not accessible or an error occured.'
              }
          });
      });
    });
  }
  
  function acceptMR({ phrase, data }) {
      return new Promise((resolve, reject) => {
          const params = phrase.split(" ");
          if (params.length < 2) {
              return resolve({
                  message: {
                      title: `I'm missing the client of the merge request id.`,
                      text: 'Usage : `!brokkr mr accept <client> <mergue_request_id>`.'
                  }
              });
          }
          const client = params[0];
          const requested = params[1];
          
          const headers = {};
          if (data.userName) {
              headers['User-Proxy'] = data.userName;
          }
          axios({
              method: "post",
              url: `${brokkr_url}/clients/${client}/merge_request`,
              headers,
              data: {
                  app_token,
                  params: {
                      merge_request: requested
                  }
              },
              timeout: 10000
          }).then(res => {
              let mr = res.data.content;
              let attachments = [{
                      title: `${mr.project.id}-${mr.iid} ► ${mr.title}: from ${mr.source_branch} in ${mr.target_branch} of ${mr.project.name || mr.project.id}.`,
                      text: `Do you really want to accept this merge request ? (yes / no).`,
                      color: "#006600",
                      title_link: mr.url,
                  }]
              return resolve({
                  message: {
                      interactive: true,
                      thread: {
                          source: phrase,
                          data: [
                              ["merge_request", `${mr.project.id}-${mr.iid}`],
                              ["client", client]
                          ],
                          handler: "accept-mr-handler",
                          duration: 30,
                          timeout_message: "Abort. Merge request was not accepted.",
                      },
                      attachments
                  }
              });
          }).catch(err => {
              if (err.response.status == 401) {
                return resolve({
                  message: {
                      title: "Brokkr can't access your data.",
                      text: `Visit <${brokkr_url}/addkey/${phrase}> to authorize the application.`
                  }
                });    
              }
              return resolve({
                  message: {
                      title: 'Could not get accept merge request.',
                      text: err.response.data.message || 'The Brokkr service is not accessible or an error occured.'
                  }
              });
          });
      });
  }
  
  function confirmMR(thread, { phrase, data }) {
      return Promise.resolve().then(() => {
          if (!phrase.toLowerCase().includes("oui") && !phrase.toLowerCase().includes("yes")) {
              return {
                  message: {
                      title: "Aborted.",
                      text: `Merge request was not accepted.`
                  }
              };
          }
          
          // Retrieve MR id.
          const request = thread.getData('merge_request');
          const client = thread.getData('client');
          
          const headers = {};
          if (data.userName) {
              headers['User-Proxy'] = data.userName;
          }
          return axios({
              method: "post",
              url: `${brokkr_url}/clients/${client}/merge_request/accept`,
              headers,
              data: {
                  app_token,
                  params: {
                      merge_request: request
                  }
              },
              timeout: 10000
          }).then(res => {
              let mr = res.data.content;
              let attachments = [{
                      title: `${mr.project.id}-${mr.iid} ► ${mr.title}: from ${mr.source_branch} in ${mr.target_branch} of ${mr.project.id}.`,
                      text: `The merge request was successfully accepted.`,
                      color: "#006600",
                      title_link: mr.url,
                  }]
              return {
                  message: {
                      attachments
                  }
              };
          }).catch(err => {
              if (err.response.status == 401) {
                return {
                  message: {
                      title: "Brokkr can't access your data.",
                      text: `Visit <${brokkr_url}/addkey/${phrase}> to authorize the application.`
                  }
                };    
              }
              let message = {};
              message.title = 'Could not get accept merge request.';
              if (err.response && err.response.data) {
                  message.text = err.response.data.message || 'The Brokkr service is not accessible or an error occured.'
              }
              return { message };
          });
      });
  }
  
  function concludeMR(thread, { phrase, data }) {
      return Promise.resolve().then(() => {
          const client = thread.getData('client');
          const project = thread.getData('project');
          const source_branch = thread.getData('source_branch');
          const target_branch = thread.getData('target_branch');
          
          if (thread.getData('title')) {
              // This is a description.
              const title = thread.getData('title');
              thread.setData('description', phrase);
              
              overseer.log("brokkr", "Sending request to Brokkr.");
              
              // Send the request.
              const headers = {};
              if (data.userName) {
                  headers['User-Proxy'] = data.userName;
              }
              return axios({
                  method: "POST",
                  url: `${brokkr_url}/clients/${client}/merge_requests/create`,
                  headers,
                  data: {
                      app_token,
                      params: {
                          project,
                          source_branch,
                          target_branch,
                          title,
                          description: phrase
                      }
                  },
                  timeout: 10000
              }).then(res => {
                  let mr = res.data.content;
                  let attachments = [{
                          title: `${mr.project.id}-${mr.iid} ► ${mr.title}: from ${mr.source_branch} in ${mr.target_branch} of ${mr.project.name || mr.project.id} successfully created.`,
                          text: `The merge request was successfully created.`,
                          color: "#006600",
                          title_link: mr.url,
                      }]
                  return {
                      message: {
                          attachments
                      }
                  };
              }).catch(err => {
                  if (err.response.status == 401) {
                    return {
                      message: {
                          title: "Brokkr can't access your data.",
                          text: `Visit <${brokkr_url}/addkey/${phrase}> to authorize the application.`
                      }
                    };    
                  }
                  return {
                      message: {
                          title: 'Could not create merge requests.',
                          text: 'The Brokkr service is not accessible or an error occured.'
                      }
                  };
              });
          } else {
              // This is a title.
              thread.setData('title', phrase);
              
              // Continue thread to ask for a description.
              return {
                  message: {
                      interactive: true,
                      text: "Let's have a nice description to add to our merge request."
                  }
              }
          }
      });
  }
  
  function createMR({ phrase, data }) {
      return Promise.resolve().then(() => {
          const splitted = phrase.trim().split(" ");
        
          if (splitted.length != 4) {
              // Command format error.
              return {
                  message: {
                    text: 'Usage: `!brokkr mr create <client> <project> <source_branch> <target_branch>`.'
                  }
              };
          }
          
          const [client, project, source_branch, target_branch] = splitted;
          
          return {
              message: {
                  interactive: true,
                  thread: {
                      source: phrase,
                      data: [
                          ["client", client],
                          ["project", project],
                          ["source_branch", source_branch],
                          ["target_branch", target_branch]
                      ],
                      handler: "create-mr-handler",
                      duration: 30,
                      timeout_message: "Abort. Merge request was not created.",
                  },
                  text: 'What title should I give to this merge request?'
              }
          };
      });
  }
  
  function brokkr({ phrase, data }) {
      const [cmd, ...params] = phrase.split(" ");
      if (cmd === "apps") {
          return listApps({ phrase: params.join(" "), data });
      } else if (cmd === "logs") {
          return appLogs({ phrase: params.join(" "), data });
      } else if (cmd === "config") {
          if (params[0] === "set") {
              return appConfigSet({ phrase: params.slice(1).join(" "), data });
          } else {
              return appConfig({ phrase: params.join(" "), data });   
          }
      } else if (cmd === "mr") {
          if (params[0] === "accept") {
              return acceptMR({ phrase: params.slice(1).join(" "), data });
          } else if (params[0] === "reject") {
              return Promise.resolve({
                  message: {
                      title: "Not implemented",
                      text: "This functionnality is currently not implemented."
                  }
              });
          } else if (params[0] === "create") {
              return createMR({ phrase: params.slice(1).join(" "), data });
          } else {
              return listMR({ phrase: params.join(" "), data });
          }
      } else {
          return Promise.resolve({
              message: {
                  title: "Not implemented",
                  text: "This functionnality is currently not implemented."
              }
          });
      }
  }
  
  function handleListApps({ entities: { 'client': client = {}}, data }) {
    return listApps({ phrase: client[0], data });
  }
  
  function handleAppLogs({ entities: { 'client': client = {}, 'application': application = {}}, data }) {
    return appLogs({ phrase: client[0] + " " + application[0], data })
  }
  
  function handleAppConfig({ entities: { 'client': client = {}, 'application': application = {}}, data }) {
    return appConfig({ phrase: client[0] + " " + application[0], data })
  }
  
  function handleListProjects({ entities: { 'client': client = {}}, data }) {
    return listProjects({ phrase: client[0], data });
  }
  
  function handleListMR({ entities: { 'client': client = {}}, data }) {
    return listMR({ phrase: client[0], data });
  }
  
  function handleAcceptMR({ entities: { 'client': client = {}, 'request': request = {}}, data }) {
    return acceptMR({ phrase: client[0] + " " + request[0], data });
  }
  /* </SKILL LOGIC> */
  
  // You may define other logic function unexposed here. Try to keep the skill code slim.