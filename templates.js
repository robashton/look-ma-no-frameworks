module.exports = {
  customers: ["<table>",
              "{{#customers}}",
              '<tr class="customer" data-customer="{{name}}"><td>{{name}}</td><td>{{bank}}</td></tr>',
              "{{/customers}}",
              "</table>"].join("\n"),
}
