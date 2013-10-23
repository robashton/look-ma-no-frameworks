module.exports = {
  customers: ["<table>",
              "{{#customers}}",
                '<tr class="customer"><td>{{name}}</td><td>{{bank}}</td></tr>',
              "{{/customers}}",
              "</table>"].join("\n"),
}
