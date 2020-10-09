<template>
  <v-card class="contact-address-container" color="#222738" dark>
    <v-toolbar class="contact-address-head" flat dense>
      <v-toolbar-title>
        <v-icon class="mr-2">mdi-book-variant</v-icon>
        <span>Contact Address</span>
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn icon>
        <v-icon>mdi-plus-circle-outline</v-icon>
      </v-btn>
    </v-toolbar>

    <v-list color="#222738" class="address-list">
      <v-list-item v-for="(contact, index) in contact" :key="index" class="address-item">
        <v-icon class="mr-3">mdi-account-circle</v-icon>

        <v-list-item-content>
          <v-list-item-title>{{ contact.name }}</v-list-item-title>
          <small class="addr-value text-truncate">{{ contact.address }}</small>
        </v-list-item-content>

        <v-list-item-icon>
          <v-btn fab icon x-small class="contact-btn">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn fab icon x-small class="contact-btn">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </v-list-item-icon>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

@Component({})
export default class ContactAddress extends Vue {
  contact = [
    {
      name: 'MXC',
      address: 'EJDKiMpQvUfHK5KKiKWoe3CT2Sm9CCWaVV'
    },
    {
      name: 'Bitrex',
      address: 'EJDKiMpQvUfHK5KKiKWoe3CT2Sm9CCWaVV'
    }
  ]
}
</script>

<style lang="scss" scoped>
.contact-address-container {
  width: inherit;
}

.contact-address-head {
  background: transparent linear-gradient(180deg, #2b3043 0%, #333848 100%) 0% 0% no-repeat
    padding-box;

  span {
    font-size: 18px;
  }
}

.address-list {
  max-height: 192px;
  overflow: auto;

  &::-webkit-scrollbar {
    width: 6px;
    border-radius: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #ffffff41;
    border-radius: 6px;
  }
}
.address-item {
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.105);
}
.address-item:nth-last-child(1) {
  border-bottom: 0;
}

.contact-btn {
  background: rgba(238, 238, 238, 0.105);
}

.contact-btn:nth-child(1) {
  margin-right: 10px;
}

.addr-value {
  opacity: 0.7;
}
</style>