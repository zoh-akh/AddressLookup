import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { AddressFeature } from "./dataInterface";

export class AddressLookupControl
  implements ComponentFramework.StandardControl<IInputs, IOutputs>
{
  private _value: string;
  private _notifyOutputChanged: () => void;
  private listElement: HTMLUListElement;
  private inputElement: HTMLInputElement;
  private labelElement: HTMLLabelElement;
  private _container: HTMLDivElement;
  private _searchContainer: HTMLDivElement;
  private _context: ComponentFramework.Context<IInputs>;
  private _refreshData: EventListenerOrEventListenerObject;

  /**
   * Empty constructor.
   */
  constructor() {}

  /**
   * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
   * Data-set values are not initialized here, use updateView.
   * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
   * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
   * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
   * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
   */
  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    // Add control initialization code
    this._context = context;
    this._container = document.createElement("div");
    this._searchContainer = document.createElement("div");
    this._searchContainer.setAttribute("id", "searchContainer");
    this._notifyOutputChanged = notifyOutputChanged;
    this._refreshData = this.refreshData.bind(this);

    // creating HTML elements for the input type range and binding it to the function which
    // refreshes the control data
    this.inputElement = document.createElement("input");
    this.inputElement.setAttribute("type", "text");
    this.inputElement.setAttribute("placeholder", "Search an address...");
    this.inputElement.addEventListener("input", this._refreshData);
    this.inputElement.setAttribute("class", "addressSearch");
    this.inputElement.setAttribute("id", "addressSearchBox");

    // creating a HTML list element that shows the addresses from the api
    this.listElement = document.createElement("ul");
    this.listElement.setAttribute("class", "addressList");
    this.listElement.setAttribute("id", "addressListBox");

    //Label control
    this.labelElement = document.createElement("label");
    this.labelElement.setAttribute("class", "LinearRangeLabel");
    this.labelElement.setAttribute("id", "lrclabel");

    // retrieving the latest value from the control and setting it to the HTMl elements.
    this._value = context.parameters.address.raw!;
    this.inputElement.setAttribute(
      "value",
      context.parameters.address.formatted
        ? context.parameters.address.formatted
        : ""
    );
    this.labelElement.innerHTML = context.parameters.address.formatted
      ? context.parameters.address.formatted
      : "";

    // appending the HTML elements to the control's HTML container element.
    this._container.appendChild(this.labelElement);
    this._container.appendChild(this._searchContainer);
    this._searchContainer.appendChild(this.inputElement);
    this._searchContainer.appendChild(this.listElement);
    container.appendChild(this._container);
  }

  public refreshData(evt: Event): void {
    this._value = this.inputElement.value as any as string;
    this.fetchAddresses(this._value);
  }

  private fetchAddresses(searchText: string): void {
    let streetSearch: string = "";
    let numberSearch: string = "";
    let regex = /\d/;
    let fetchURL: string =
      "https://services.arcgis.com/rYz782eMbySr2srL/arcgis/rest/services/Addresses/FeatureServer/1/query?where=";
    if (searchText.length == 0) {
      this.listElement.innerHTML = "Please type an address to begin";
      return;
    }
    if (regex.test(searchText)) {
      if (/^\d+$/.test(searchText)) {
        numberSearch = searchText.trim();
        fetchURL = fetchURL.concat(
          `NUMBER_COMPLETE like '`,
          numberSearch,
          `%'`
        );
      } else {
        numberSearch = searchText.split(" ")[0].trim();
        streetSearch = streetSearch.concat(
          ...searchText.split(" ").slice(1).join(" ")
        );
        fetchURL = fetchURL.concat(
          `NUMBER_COMPLETE like '`,
          numberSearch,
          `' and `,
          `FULL_STREET_NAME like '`,
          streetSearch,
          `%'`
        );
      }
    } else {
      streetSearch = searchText.trim();
      fetchURL = fetchURL.concat(`FULL_STREET_NAME like '`, streetSearch, `%'`);
    }
    fetch(fetchURL + `&outFields=*&outSR=4326&f=json`)
      .then((response) => {
        if (!response.ok) {
          // Handle HTTP errors
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // console.log(data.features);
        this.listElement.innerHTML = "";
        data.features.forEach((attributes: AddressFeature) => {
          let listItem = document.createElement("li");
          listItem.textContent =
            (attributes.attributes.UNIT_NUMBER_COMPLETE == null
              ? ""
              : attributes.attributes.UNIT_NUMBER_COMPLETE + " - ") +
            attributes.attributes.NUMBER_COMPLETE +
            " " +
            attributes.attributes.FULL_STREET_NAME +
            " " +
            (attributes.attributes.SETTLEMENT == null
              ? ""
              : attributes.attributes.SETTLEMENT) +
            " " +
            attributes.attributes.COMMUNITY;
          listItem.addEventListener("click", () =>
            this.selectAddress(listItem.textContent!)
          );
          this.listElement.appendChild(listItem);
        });
      });
  }

  public selectAddress(selectedAddress: string): void {
    this._value = selectedAddress;
    this.inputElement.value = "";
    this._notifyOutputChanged();
  }
  /**
   * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
   * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
   */
  public updateView(context: ComponentFramework.Context<IInputs>): void {
    this._value = context.parameters.address.raw!;
    this._context = context;
    this.inputElement.setAttribute("value", "");
    this.labelElement.innerHTML = context.parameters.address.formatted
      ? context.parameters.address.formatted
      : "";
  }

  /**
   * It is called by the framework prior to a control receiving new data.
   * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as "bound" or "output"
   */
  public getOutputs(): IOutputs {
    this.labelElement.innerHTML = this._context.parameters.address.formatted
      ? this._context.parameters.address.formatted
      : "";
    this.inputElement.setAttribute("value", "");
    this.listElement.innerHTML = "Please type an address to begin";
    return {
      address: this._value, //Need to add the logic of address selected as address
    };
  }

  /**
   * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
   * i.e. cancelling any pending remote calls, removing listeners, etc.
   */
  public destroy(): void {
    // Add code to cleanup control if necessary
    this.inputElement.removeEventListener("input", this._refreshData);
  }
}
