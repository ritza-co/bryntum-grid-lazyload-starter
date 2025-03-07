import { Grid, StringHelper } from "./grid.module.js";

const grid = new Grid({
  appendTo: "app",
  selectionMode: { rowNumber: true },

  features: {
    filter: {
      allowedOperators: ["*", "=", "<", ">"],
    },
  },

  columns: [
    { text: "Sort", field: "sortIndex", align: "center" },
    { text: "Id", field: "id", hidden: true },
    {
      text: "Name",
      field: "name",
      htmlEncode: false,
      flex: 2,
      renderer: ({ value }) => {
        if (value) {
          const nameParts = value?.split(" "),
            initials =
              value[0] +
              (nameParts?.length > 1 ? nameParts.reverse()[0][0] : "");

          return [
            {
              class: "b-resource-avatar b-resource-initials",
              style: {
                "margin-inline-end": "1em",
              },
              text: initials,
            },
            value,
          ];
        }
      },
    },
    {
      text: "Age",
      field: "age",
      width: 100,
      type: "number",
      align: "center",
    },
    {
      text: "City",
      field: "city",
      flex: 1,
    },
    {
      text: "Email",
      field: "email",
      flex: 2,
      htmlEncode: false,
      renderer: ({ value }) => {
        return StringHelper.xss`<i class="b-fa b-fa-envelope" style="color:#ea9c01"></i><a href="mailto:${value}">${value}</a>`;
      },
    },
  ],
  store: {
    fields: ["sortIndex", "age", "city", "food", "name", "email"],
    readUrl: "http://localhost:1337/read",
    createUrl: "http://localhost:1337/create",
    deleteUrl: "http://localhost:1337/delete",
    updateUrl: "http://localhost:1337/update",
    autoLoad: true,
    autoCommit: true,
    // pass sort and filter data to the server encoded in the URL
    sortParamName: "sort",
    filterParamName: "filter",
    listeners: {
      beforeCommit() {
        updateNetworkValue("Committing", "red");
      },
      commit() {
        updateNetworkValue();
      },
    },
  },
  tbar: [
    {
      type: "container",
      style: "align-content:center",
      items: {
        label: "Network status:",
        networkValue: "Idle",
      },
    },
    "->",
    {
      type: "button",
      text: "Add",
      icon: "b-fa b-fa-add",
      ref: "addButton",
      onClick() {
        const sortIndex = grid.store.records[0]?.sortIndex / 2 || 1,
          [newRecord] = grid.store.insert(0, { sortIndex });

        grid.startEditing({ id: newRecord.id, columnIndex: 2 });
      },
    },
  ],
});

const updateNetworkValue = (text = "Idle", color = "green") => {
  const { networkValue } = grid.widgetMap;
  networkValue.html = text;
  networkValue.element.style.color = color;
};
