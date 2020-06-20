const log = console.log;

function cho(str){
	let arr = [
		"ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ",
		"ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ",
		"ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ",
		"ㅎ"
	]
	let result = [];
	for(let i = 0; i < str.length; i++){
		let idx = Math.floor((str[i].charCodeAt()-44032)/588);
		result.push(arr[idx] || str[i]);
	}

	return result.join('');
}

function match(keyword,data){
	let dataCho = cho(data);
	let keywordCho = cho(keyword);
	let index = -1;
	let result = [];

	do {

		index = dataCho.indexOf(keywordCho,(index+1));
		if(index > -1) result.push(index);

	} while(index > -1);
	return result;
}

function search(keyword,data){
	let indexes = match(keyword,data);
	let keywordLength = keyword.length;
	let dataCho = cho(data);
	let result = -1;

	for(let i = 0; i < indexes.length; i++){
		let index = indexes[i];
		let flag = true;

		for(let j = 0; j < keywordLength; j++){
			let keywordChar = keyword[j];
			let dataChar = (keywordChar.match(/[ㄱ-ㅎ]/) ? dataCho : data)[j+index];
			if(keywordChar !== dataChar) flag = false;
		}
		if(flag){
			result = index;
			break;
		}
	}
	return result;
}

class App {
	constructor(list){
		this.productList = list;
		this.basket = [];
		this.init();
	}

	drawProduct(item){
		let div = this.makeDiv(item);
		document.querySelector(".item-list").appendChild(div);
		$(div).draggable({
			cursor:"pointer",
			appendTo : ".basket",
			helper: "clone",
			revert: true,
			containtment : "parent"
		});
		this.calcTotal();
	}

	init(){
		// 처음 다 그려놓기
		this.productList.forEach(x=>{
			this.drawProduct(x);
		});

		// 처음 다 그려혾기 끝

		// droppable 만들기

		$(".basket").droppable({
			accpet:".item",
			drop:(e,ui)=>{
				let id = ui.draggable[0].dataset.id;
				let item = this.productList[id-1];
				let exist = this.basket.find(function(x){
					return x.id == id;
				});
				if(exist !== undefined){
					alert("이미 장바구니에 존재하는 상품입니다.");
					return;
				}
				item.cnt = 1;
				item.total = item.cnt * item.priceNum;
				this.basket.push(item);
				this.calcTotal();
				let li = this.makeLi(item);
				li.querySelectorAll("button").forEach(x=>{
					x.addEventListener("click",(e)=>{
						let num = x.dataset.num;
						if(item.cnt == 1 && num == -1) return;
						item.cnt += num*1;
						li.querySelector(".cnt_num").innerHTML = item.cnt;
						item.total = item.priceNum * item.cnt;
						li.querySelector(".basket-item-total").innerHTML = item.total.toLocaleString()+"원";
						this.calcTotal();
					});
				});
				li.querySelector(".basket-item-times").addEventListener("click",(e)=>{
					let idx = -1;
					this.basket.forEach((x,i)=>{
						if(x.id === item.id) idx = i;
					});
					this.basket.splice(idx,1);
					$(li).remove();
					this.calcTotal();
				});	
				let list = document.querySelector(".basket-item-list")
				list.appendChild(li);
				list.scrollTop = list.scrollHeight;
			}
		});

		// droppable 만들기 끝

		// 구매버튼 눌렀을떄

		document.querySelector(".canvas-popup-times").addEventListener("click",(e)=>{
			$("#canvas-popup").fadeOut();
		});

		document.querySelector(".pc-close").addEventListener("click",(e)=>{
			$("#pc-popup").fadeOut();
		});

		document.querySelector("#buy").addEventListener("click",(e)=>{
			$("#pc-popup").fadeIn();
			$("#pc-popup input").val("");
		});

		document.querySelector(".pc-pc").addEventListener("click",(e)=>{
			if(document.querySelector("#pc-user").value == ""){
				alert("구매자 이름 값이 비어있습니다.");
				return;
			}
			if(document.querySelector("#pc-address").value == ""){
				alert("주솟값이 비어있습니다.");
				return;	
			}

			$("#pc-popup").fadeOut();
			$("#canvas-popup").fadeIn();

			let canvas = document.createElement("canvas");
			let width = 400;
			let height = this.basket.length*20+120;
			canvas.width = width;
			canvas.height = height;
			document.querySelector("#canvas-popup > .div-wrapper").innerHTML = "";
			document.querySelector("#canvas-popup > .div-wrapper").appendChild(canvas);
			let ctx = canvas.getContext("2d");
			ctx.fillStyle = "#fff";
			ctx.fillRect(0,0,width,height);
			ctx.fill();
			ctx.strokeStyle = "#000";
			ctx.strokeRect(0,0,width,height);
			ctx.stroke();
			ctx.fillStyle = "#333030";
			ctx.textAlign = "center";
			ctx.textBaseline = "top";
			ctx.font = "17px Arial bold";
			ctx.fillText("구매 내역서",width/2,20);
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(25,50);
			ctx.lineTo(width-25,50);
			ctx.closePath();
			ctx.stroke();
			ctx.font = "14px Arial lighter";
			let nextHeight = this.basket.length*20+60;
			this.basket.forEach((x,idx)=>{
				let text = `${x.name} | ${x.price}원 | ${x.cnt}개 | ${x.total.toLocaleString()}원`;
				ctx.fillText(text,width/2,60+idx*20);
			});
			ctx.beginPath();
			ctx.moveTo(25,nextHeight);
			ctx.lineTo(width-25,nextHeight);
			ctx.stroke();
			ctx.closePath();
			let date = new Date();
			let today = `${date.getFullYear()}년 ${date.getMonth()+1}월 ${date.getDate()}일 ${date.getHours()}시 ${date.getMinutes()}분 ${date.getSeconds()}초`;
			ctx.fillText("구매 일자 : "+today,width/2,nextHeight+10);
			ctx.font = "17px Arial bold";
			let txt = `총 합계 : ${this.calcTotal().toLocaleString()}원`;
			ctx.fillText(txt,width/2,nextHeight+30);
			this.basket = [];
			document.querySelector(".basket-item-list").innerHTML = "";
			this.calcTotal();
		});

		// 구매버튼 끝

		// 초성검색

		document.querySelector("#search-input").addEventListener("input",(e)=>{
			let value = e.target.value;
			let drawArr = [];
			this.productList.forEach(x=>{
				if(value == ""){
					drawArr.push(x);
				} else {
					let flag = false;
					if(search(value,x.name) != -1 || search(value,x.brand) != -1) drawArr.push(x);
				}
			});
			document.querySelector(".item-list").innerHTML = "";
			drawArr.forEach(x=>{
				this.drawProduct(x);
			});
			if(drawArr.length == 0){
				let h1 = document.createElement("h1");
				
			}
		});

		// 초성검색 끝
	}

	calcTotal(){
		let total = 0;
		this.basket.forEach(x=>{
			total += x.total;
		});
		document.querySelector(".basket-total").innerHTML = "총 합계 : "+ total.toLocaleString()+"원";
		return total;
	}

	makeLi(item){
		let li = document.createElement("li");
		li.classList.add("basket-item");
		li.dataset.id = item.id;
		li.innerHTML = `<img src="${item.photo}" alt="product${item.id} img" title="상품이미지 ${item.id}">
						<div class="basket-item-text">
							<p class="basket-item-brand">
								${item.brand}
							</p>
							<p class="basket-item-name">
								${item.name}
							</p>
							<p class="basket-item-price">
								${item.price}원
							</p>
						</div>
						<div class="basket-item-cnt_total">
							<div class="basket-item-cnt">
								<button data-num="-1">
									<i class="fa fa-minus"></i>
								</button>
								<span class="cnt_num">${item.cnt}</span>
								<button data-num="1">
									<i class="fa fa-plus"></i>
								</button>
							</div>

							<div class="basket-item-total">
								${item.total.toLocaleString()}원
							</div>
						</div>

						<div class="basket-item-times">
							<i class="fa fa-times"></i>
						</div>`;
		return li;						
	}

	makeDiv(item){
		let div = document.createElement("div");
		div.classList.add("item");
		div.dataset.id = item.id;
		div.innerHTML = `<span class="item-brand">
							${item.brand}
						</span>
						<div class="item-box">
							<img src="${item.photo}" alt="product${item.id} img" title="상품 이미지${item.id}"
							>
							<p class="item-name">
								${item.name}
							</p>
							<p class="item-price">
								${item.price.toLocaleString()}원
							</p>
						</div>`;
		return div;
	}
}

window.addEventListener("load",(e)=>{
	$.getJSON("store.json",function(json){
		let list = [];
		json.forEach(x=>{
			let product = new Product(x.brand,x.id,x.photo,x.price,x.product_name);
			list.push(product);
		});
		let app = new App(list);
	});	
});

class Product {
	constructor(brand,id,photo,price,name){
		this.brand = brand;
		this.id = id;
		this.photo = photo;
		this.price = price;
		this.name = name;
		this.cnt = 1;
		this.priceNum = (this.price.split(",").join(''))*1;
		this.total = this.priceNum * this.cnt;
	}
}