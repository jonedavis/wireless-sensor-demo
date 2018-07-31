'use strict';

var faxes = new Vue({
  el: '#app',
  data: {
    simSid: '',
    simResource: {},
    dataSession: {
      cellLocationEstimate: {}
    },
    ascending: false,
    commandsInvisible: false,
    dataSessionsInvisible: false,
    simSidInvisible: true,
    sortColumn: '',
    rows: [],
    chartTemperature: {},
    temperatureData: [],
    chartHumidity: {},
    humidityData: []
  },
  mounted: function () {
    this.$data.simSid = this.getSimSid();
    this.initCharts();
    this.updateDashboard();
    // Timers
    setInterval(() => {
      this.updateCharts();
      this.getCommands();
    }, 10000);
  },
  methods: {
    'initCharts': function initCharts() {
      var data = {
        series: [{
          name: 'ticks',
          data: []
        }]
      };
      var options = {
        width: 520,
        height: 400,
        showArea: true,
        lineSmooth: true,
        fullWidth: true,
        axisX: {
          showLabel: false,
          divisor: 5,
          labelInterpolationFnc: function (value) {
            return new Date(value).toLocaleTimeString('en-us', {
              weekday: 'short'
            });
          }
        }
      };
      this.$data.chartTemperature = new Chartist.Line('#chart-temperature', data, options);
      this.$data.chartHumidity = new Chartist.Line('#chart-humidity', data, options);
    },
    'updateCharts': function updateCharts() {
      this.$data.chartTemperature.update({
        series: [this.$data.temperatureData]
      });
      this.$data.chartHumidity.update({
        series: [this.$data.humidityData]
      });
    },
    'insertChartData': function insertChartData(cmd) {
      // Parse temperature and humidity from Command
      if (cmd.command === undefined) return;
      let th = cmd.command.split(',');
      if (Number.isFinite(parseFloat(th[0])) && Number.isFinite(parseFloat(th[1]))) {
        this.$data.temperatureData.push({
          x: new Date(cmd.dateCreated),
          y: th[0]
        });
        this.$data.humidityData.push({
          x: new Date(cmd.dateCreated),
          y: th[1]
        });
        // Sort it
        this.$data.temperatureData.sort((a, b) => a - b);
        this.$data.humidityData.sort((a, b) => a - b);
      }
    },
    'updateDashboard': function updateDashboard() {
      this.getSimResource();
      this.getDataSessions();
      this.getCommands();
    },
    'showCommands': function showCommands() {
      this.commandsInvisible = !this.commandsInvisible;
    },
    'showDataSessions': function showDataSessions() {
      this.dataSessionsInvisible = !this.dataSessionsInvisible;
    },
    'showSimSid': function showDataSessions() {
      this.simSidInvisible = !this.simSidInvisible;
    },
    'saveSimSid': function saveSimSid() {
      store.set('wireless-se-demo', {
        'sid': this.$data.simSid
      });
      this.updateDashboard();
    },
    'getSimSid': function getSimSid() {
      if (store.get('wireless-se-demo') === undefined) return '';
      return store.get('wireless-se-demo').sid;
    },
    'isValidSim': function isValidSim() {
      let sid = this.getSimSid();
      if (sid === undefined || sid === '') return false;
      return sid.toString().toLowerCase().startsWith('de') && sid.length >= 32;
    },
    'updateCommandsTable': function updateCommandsTable(commands) {
      commands.body.forEach(command => {
        if (!this.rows.some(e => e.sid === command.sid && command.status === 'received')) {
          let cmd = {
            sid: command.sid,
            command: command.command,
            status: command.status,
            dateCreated: command.dateCreated
          };
          this.rows.push(cmd)
          this.insertChartData(cmd);
          this.updateCharts();
        }
      });
    },
    'getSimResource': function getSimResource() {
      if (!this.isValidSim()) return;
      this.$http.get(`/Sims/${this.getSimSid()}`)
        .then(response => {
          this.$data.simResource = response.body;
        }, error => {
          console.log(error.statusText);
        });
    },
    'getCommands': function getCommands() {
      if (!this.isValidSim()) return;
      // Retrieve the first page of Commands
      this.$http.get(`/Commands/${this.getSimSid()}`)
        .then(response => {
          this.updateCommandsTable(response);
        }, error => {
          console.log(error.statusText);
        });
    },
    'getDataSessions': function getDataSession() {
      if (!this.isValidSim()) return;
      // Retrieve the first resource of DataSessions
      this.$http.get(`/DataSessions/${this.getSimSid()}`)
        .then(response => {
          this.$data.dataSession = response.body[0] || {
            cellLocationEstimate: {}
          };
        }, error => {
          console.log(error.statusText);
        });
    }
  },
  computed: {
    'columns': function columns() {
      if (this.rows.length == 0) {
        return [];
      }
      return Object.keys(this.rows[0])
    }
  },
  filters: {
    capitalize: function (value) {
      if (!value) return '';
      value = value.toString();
      return value.charAt(0).toUpperCase() + value.slice(1);
    },
    formatDate: function (value) {
      if (value) {
        return new Date(value).toLocaleTimeString('en-us', {
          weekday: 'short'
        });
      }
    }
  }
});