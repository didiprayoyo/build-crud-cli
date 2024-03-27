const yargs = require("yargs");
const fs = require("fs");
const validator = require("validator");
const process = require("process");

// check if directory "./data" exists, create the dir if it doesn't
const dirPath = "./data";
if (!fs.existsSync(dirPath)){
    fs.mkdirSync(dirPath);
}

// check if file "contacts.json" in "./data" exists, create the file if it doesn't
const filePath = "./data/contacts.json";
if (!fs.existsSync(filePath)){
    fs.writeFileSync(filePath, "[]", "utf8");
}

yargs.command({
    command: "add",
    describe: "add new contact",
    builder:{
        name:{
            describe: "contact name",
            demandOption: true,
            type: "string",
        },
        mobile:{
            describe: "contact mobile phone number",
            demandOption: true,
            type: "string",
        },
        email:{
            describe: "contact email address (optional)",
            demandOption: false,
            type: "string",
        },
    },
    handler(argv){
        const contact = {
            name:argv.name,
            mobile:argv.mobile,
            email:argv.email,
        };
        // to check and debug
        console.log(contact);

        // name as unique value
        /**
         * boolean to check if there is argv.name in our database contacts.json, 
         * also mobile phone number and email address format are valid
         */
        let success = true;
        
        // read json file, then parse to array of object
        const file = fs.readFileSync(filePath, "utf8");
        const contacts = JSON.parse(file);
        // check name duplication
        if (contacts.find((existingContact) => existingContact.name.toLowerCase() === contact.name.toLowerCase())) {
            console.log(`The name "${contact.name}" already exists`);
            success = false;
        }
        // validasi nomor telepon, format Indonesia
        if (!validator.isMobilePhone(contact.mobile, 'id-ID')) {
            console.log("Wrong phone number format: your phone number must be an Indonesian number");
            success = false;
        }
        // validasi format email
        if (contact.email && !validator.isEmail(contact.email)) {   
            console.log("Wrong email format");
            success = false;
        }

        // if the name is not duplicated (not already exists in our database) and other inputs' format is valid, save to json
        if (success) {
            // add new contact to contacts.json
            contacts.push(contact);
            fs.writeFileSync(filePath, JSON.stringify(contacts));
            console.log("Terimakasih sudah memasukkan data");
        }
    },
});

yargs.command({
    command: "detail",
    describe: "detail of a contact by name",
    builder:{
        name:{
            describe: "contact name",
            demandOption: true,
            type: "string",
        },
    },
    handler(argv){
        // read json file, then parse to array of objects
        const file = fs.readFileSync(filePath, 'utf8');
        const contacts = JSON.parse(file);
        // find (case sensitive) contact by given name in argv
        const contact = contacts.find((existingContact) => existingContact.name.toLowerCase() === argv.name.toLowerCase());
        // to check and debug
        console.log(contact);

        // if the name exists, show the detail of the contact
        if (contact) {
            console.log("--- Contact detail ---\n" +
                        `Name\t: ${contact.name}\n` +
                        `Phone\t: ${contact.mobile}\n` +
                        `Email\t: ${contact.email || "N/A"}\n`
            );
        } else {
            console.log(`Name "${argv.name}" doesn't exist`);
        }
    }
});

yargs.command({
    command: "list",
    describe: "show all list of contacts",
    handler(argv){
        // read json file, then parse to array of objects
        const file = fs.readFileSync(filePath, "utf8");
        const contacts = JSON.parse(file);
        // if there is at least one contact, show all contacts' name and mobile phone number
        if (contacts.length > 0) {
            console.log("--- Contacts ---");
            contacts.forEach((contact) => {
                console.log(`Name\t: ${contact.name}\t|  ` +
                            `Phone\t: ${contact.mobile}`//\t|  ` +
                            // `Email\t: ${contact.email || "N/A"}`
                );
            })
        } else { // no contact was added
            console.log("No contact was added, please add contact before use command 'list'!");
        }
    }
});

yargs.command({
    command: "update",
    describe: "update a contact",
    builder:{
        name:{
            describe: "contact name",
            demandOption: true,
            type: "string",
        },
        mobile:{
            describe: "new mobile phone number (optional)",
            demandOption: false,
            type: "string",
        },
        email:{
            describe: "new email address (optional)",
            demandOption: false,
            type: "string",
        },
    },
    handler(argv){
        // read json file, then parse it to array of objects
        const file = fs.readFileSync(filePath, "utf8");
        const contacts = JSON.parse(file);
        // find contact index of contact by given name if it exists
        const contactIndex = contacts.findIndex((existingContact) => existingContact.name.toLowerCase() === argv.name.toLowerCase());

        // if the contact is found, update the contact
        if (contactIndex != -1) {
            // if mobile was written in argv
            if (argv.mobile) {
                // and if the format of mobile phone number is valid, update the contact mobile phone number 
                if (validator.isMobilePhone(argv.mobile, "id-ID")) {
                    contacts[contactIndex].mobile = argv.mobile;
                    console.log("Mobile phone number updated successfully");
                } else { // but if it is not, do nothing to the contact mobile phone number 
                    console.log("Wrong phone number format: your phone number must be an Indonesian number");
                }
            }

            // if email was written in argv
            if (argv.email) {
                // and if the format of email address is valid, update the contact email address 
                if (validator.isEmail(argv.email)) {
                    contacts[contactIndex].email = argv.email;
                    console.log("Email address updated successfully");
                } else { // but if it is not, do nothing to the contact email address 
                    console.log("Wrong email format");
                }
            }

            // write new updated stringified contacts to json
            fs.writeFileSync(filePath, JSON.stringify(contacts));
            // to check and debug updated contacts
            console.log("--- Updated contact detail ---\n" +
                        `Name\t: ${contacts[contactIndex].name}\n` +
                        `Phone\t: ${contacts[contactIndex].mobile}\n` +
                        `Email\t: ${contacts[contactIndex].email || "N/A"}\n`
            );
        } else { // if the contact is not found
            console.log(`Failed to update. Name "${argv.name}" doesn't exist`);
        }
    }
});

yargs.command({
    command: "delete",
    describe: "detele an existed contact",
    builder:{
        name:{
            describe: "contact name",
            demandOption: true,
            type: "string",
        },
    },
    handler(argv){
        // read json file, then parse it to array of objects
        const file = fs.readFileSync(filePath, 'utf8');
        const contacts = JSON.parse(file);
        // delete the contact by filtering all contacts not having the name given in argv
        const updatedContacts = contacts.filter((existingContact) => existingContact.name.toLowerCase() !== argv.name.toLowerCase());

        // if the contact was deleted, update database by writing new updated contacts
        if (updatedContacts.length == contacts.length-1) {
            fs.writeFileSync(filePath, JSON.stringify(updatedContacts));
            console.log(`Contact "${argv.name}" deleted successfully`);
        } else { // if the contact was not found
            console.log(`Failed to delete. Name "${argv.name}" doesn't exist`);
        }
    }
});

yargs.parse(); // process yargs.command()
process.exit();